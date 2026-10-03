package com.unifiedactionsheet

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.content.res.AppCompatResources
import androidx.appcompat.widget.AppCompatEditText
import androidx.appcompat.widget.AppCompatTextView
import androidx.core.graphics.ColorUtils
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.widget.NestedScrollView

private const val DISABLED_TEXT_ALPHA = 97

/// A button row. Knows its index and both of its colors, so a prompt can
/// enable or disable it while the user types (requiresText).
internal class OptionRow(
  context: Context,
  val index: Int,
  /// For end-to-end tests: the view tag (Detox) and the accessibility
  /// resource id (UiAutomator, Maestro, Appium).
  val testID: String?,
  private val enabledColor: Int,
  private val disabledColor: Int,
) : AppCompatTextView(context) {
  init {
    if (testID != null) tag = testID
  }

  fun setRowEnabled(enabled: Boolean) {
    isEnabled = enabled
    setTextColor(if (enabled) enabledColor else disabledColor)
  }
}

/// An end-to-end id for any view: its tag (Detox) and its accessibility
/// resource id (UiAutomator, Maestro, Appium). Rows set theirs in their own
/// delegate; this is for the dialog content and prompt fields.
internal fun View.applyTestID(testID: String?) {
  if (testID == null) return

  tag = testID
  ViewCompat.setAccessibilityDelegate(
    this,
    object : AccessibilityDelegateCompat() {
      override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.viewIdResourceName = testID
      }
    },
  )
}

/// Every OptionRow below this view, in layout order.
internal fun View.optionRows(): List<OptionRow> = when (this) {
  is OptionRow -> listOf(this)
  is ViewGroup -> (0 until childCount).flatMap { getChildAt(it).optionRows() }
  else -> emptyList()
}

internal fun buildContent(
  context: Context,
  options: ActionSheetOptions,
  palette: SheetPalette,
  includeCancelRow: Boolean = true,
  /// Sits between the message and the rows. Only the prompt supplies one.
  inputView: View? = null,
  onSelect: (Int) -> Unit,
): LinearLayout {
  val container = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
    setPadding(dp(context, 8), dp(context, 8), dp(context, 8), dp(context, 16))
  }

  options.title?.takeIf { it.isNotBlank() }?.let {
    container.addView(buildHeader(context, it, palette.secondaryText, isTitle = true))
  }
  options.message?.takeIf { it.isNotBlank() }?.let {
    container.addView(buildHeader(context, it, palette.secondaryText, isTitle = false))
  }

  inputView?.let(container::addView)

  val centerLabels = options.buttonTextAlignment == ButtonTextAlignment.CENTER

  val optionColor = parseColor(options.tintColor) ?: palette.primaryText
  val cancelColor = parseColor(options.cancelButtonTintColor) ?: optionColor
  // Disabled rows drop their role color for a neutral dim, matching iOS, where
  // UIKit owns the appearance of a disabled action.
  val disabledColor = ColorUtils.setAlphaComponent(palette.primaryText, DISABLED_TEXT_ALPHA)

  val optionRows = LinearLayout(context).apply {
    orientation = LinearLayout.VERTICAL
  }

  options.options.forEachIndexed { index, label ->
    if (index == options.cancelButtonIndex) return@forEachIndexed
    val isDestructive = index in options.destructiveButtonIndices
    optionRows.addView(
      buildOption(
        context = context,
        index = index,
        testID = options.testIDs.getOrNull(index),
        accessibilityLabel = options.accessibilityLabels.getOrNull(index),
        accessibilityHint = options.accessibilityHints.getOrNull(index),
        label = label,
        color = if (isDestructive) parseColor(options.destructiveColor) ?: palette.error else optionColor,
        centered = centerLabels,
        enabled = index !in options.disabledButtonIndices,
        bold = index == options.preferredButtonIndex,
        disabledColor = disabledColor,
        onPress = { onSelect(index) },
      ),
    )
  }

  if (includeCancelRow) {
    options.cancelButtonIndex?.let { cancelIdx ->
      if (cancelIdx in options.options.indices) {
        optionRows.addView(buildSpacer(context))
        optionRows.addView(
          buildOption(
            context = context,
            index = cancelIdx,
            testID = options.testIDs.getOrNull(cancelIdx),
            accessibilityLabel = options.accessibilityLabels.getOrNull(cancelIdx),
            accessibilityHint = options.accessibilityHints.getOrNull(cancelIdx),
            label = options.options[cancelIdx],
            color = cancelColor,
            centered = centerLabels,
            enabled = cancelIdx !in options.disabledButtonIndices,
            bold = cancelIdx == options.preferredButtonIndex,
            disabledColor = disabledColor,
            onPress = { onSelect(cancelIdx) },
          ),
        )
      }
    }
  }

  val scroll = NestedScrollView(context).apply {
    addView(optionRows)
    layoutParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT,
      1f,
    )
  }
  container.addView(scroll)

  return container
}

/// The prompt's field, or for LOGIN_PASSWORD its login and password fields.
internal fun buildPromptFields(
  context: Context,
  options: PromptOptions,
  palette: SheetPalette,
): List<EditText> {
  val first = buildPromptField(
    context = context,
    palette = palette,
    testID = options.fieldTestID,
    hint = options.placeholder,
    inputType = options.keyboardType.toInputType(options.type == PromptType.SECURE_TEXT),
    autofillHint = if (options.type == PromptType.LOGIN_PASSWORD) View.AUTOFILL_HINT_USERNAME else null,
  ).apply {
    setText(options.defaultValue.orEmpty())
    // Land the caret after any default value rather than before it.
    setSelection(text?.length ?: 0)
  }

  if (options.type != PromptType.LOGIN_PASSWORD) return listOf(first)

  val password = buildPromptField(
    context = context,
    palette = palette,
    testID = options.passwordFieldTestID,
    hint = options.passwordPlaceholder,
    inputType = PromptKeyboardType.DEFAULT.toInputType(secure = true),
    autofillHint = View.AUTOFILL_HINT_PASSWORD,
  )

  return listOf(first, password)
}

private fun buildPromptField(
  context: Context,
  palette: SheetPalette,
  testID: String?,
  hint: String?,
  inputType: Int,
  autofillHint: String?,
): EditText = AppCompatEditText(context).apply {
  this.hint = hint
  setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
  setTextColor(palette.primaryText)
  setHintTextColor(ColorUtils.setAlphaComponent(palette.secondaryText, DISABLED_TEXT_ALPHA))
  setPadding(dp(context, 16), dp(context, 8), dp(context, 16), dp(context, 8))
  isSingleLine = true
  // After isSingleLine, never before: setSingleLine() installs
  // SingleLineTransformationMethod, which replaces the password masking that
  // setInputType() sets up. Ordering them the other way renders a secure field
  // in plain text while still reporting a password input type.
  this.inputType = inputType
  // Lets the autofill service offer saved credentials, like iOS AutoFill.
  if (autofillHint != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    setAutofillHints(autofillHint)
  }
  layoutParams = LinearLayout.LayoutParams(
    LinearLayout.LayoutParams.MATCH_PARENT,
    LinearLayout.LayoutParams.WRAP_CONTENT,
  )
  applyTestID(testID)
}

private fun buildHeader(
  context: Context,
  text: String,
  color: Int,
  isTitle: Boolean,
): TextView =
  TextView(context).apply {
    this.text = text
    gravity = Gravity.CENTER
    setPadding(dp(context, 16), dp(context, 12), dp(context, 16), dp(context, 8))
    setTextSize(TypedValue.COMPLEX_UNIT_SP, if (isTitle) 14f else 12f)
    setTextColor(color)
    if (isTitle) {
      ViewCompat.setAccessibilityHeading(this, true)
    }
  }

private fun buildOption(
  context: Context,
  index: Int,
  testID: String?,
  accessibilityLabel: String?,
  accessibilityHint: String?,
  label: String,
  color: Int,
  centered: Boolean,
  enabled: Boolean,
  bold: Boolean,
  disabledColor: Int,
  onPress: () -> Unit,
): View = OptionRow(context, index, testID, color, disabledColor).apply {
  text = label
  gravity = if (centered) Gravity.CENTER_HORIZONTAL else Gravity.START
  setPadding(dp(context, 16), dp(context, 16), dp(context, 16), dp(context, 16))
  setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
  // The preferred button: bold, as iOS shows an alert's preferred action.
  if (bold) setTypeface(typeface, Typeface.BOLD)
  background = AppCompatResources.getDrawable(context, selectableItemBackgroundRes(context))
  isClickable = true
  isFocusable = true
  setRowEnabled(enabled)
  setOnClickListener { onPress() }
  contentDescription = accessibilityLabel ?: label
  ViewCompat.setAccessibilityDelegate(
    this,
    object : AccessibilityDelegateCompat() {
      override fun onInitializeAccessibilityNodeInfo(
        host: View,
        info: AccessibilityNodeInfoCompat,
      ) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.className = Button::class.java.name
        testID?.let { info.viewIdResourceName = it }
        accessibilityHint?.let { info.hintText = it }
      }
    },
  )
}

private fun buildSpacer(context: Context): View = View(context).apply {
  layoutParams = LinearLayout.LayoutParams(
    LinearLayout.LayoutParams.MATCH_PARENT,
    dp(context, 8),
  )
}

private fun parseColor(value: String?): Int? = value?.let {
  runCatching { Color.parseColor(it) }.getOrNull()
}
