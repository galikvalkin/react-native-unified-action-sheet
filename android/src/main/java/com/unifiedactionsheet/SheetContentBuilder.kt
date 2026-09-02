package com.unifiedactionsheet

import android.content.Context
import android.graphics.Color
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.content.res.AppCompatResources
import androidx.appcompat.widget.AppCompatEditText
import androidx.core.graphics.ColorUtils
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.widget.NestedScrollView

private const val DISABLED_TEXT_ALPHA = 97

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
        label = label,
        color = if (isDestructive) parseColor(options.destructiveColor) ?: palette.error else optionColor,
        centered = centerLabels,
        enabled = index !in options.disabledButtonIndices,
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
            label = options.options[cancelIdx],
            color = cancelColor,
            centered = centerLabels,
            enabled = cancelIdx !in options.disabledButtonIndices,
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

internal fun buildPromptInput(
  context: Context,
  options: PromptOptions,
  palette: SheetPalette,
): EditText = AppCompatEditText(context).apply {
  setText(options.defaultValue.orEmpty())
  hint = options.placeholder
  setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
  setTextColor(palette.primaryText)
  setHintTextColor(ColorUtils.setAlphaComponent(palette.secondaryText, DISABLED_TEXT_ALPHA))
  setPadding(dp(context, 16), dp(context, 8), dp(context, 16), dp(context, 8))
  isSingleLine = true
  // After isSingleLine, never before: setSingleLine() installs
  // SingleLineTransformationMethod, which replaces the password masking that
  // setInputType() sets up. Ordering them the other way renders a secure field
  // in plain text while still reporting a password input type.
  inputType = options.keyboardType.toInputType(options.secureTextEntry)
  // Land the caret after any default value rather than before it.
  setSelection(text?.length ?: 0)
  layoutParams = LinearLayout.LayoutParams(
    LinearLayout.LayoutParams.MATCH_PARENT,
    LinearLayout.LayoutParams.WRAP_CONTENT,
  )
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
  label: String,
  color: Int,
  centered: Boolean,
  enabled: Boolean,
  disabledColor: Int,
  onPress: () -> Unit,
): View = TextView(context).apply {
  text = label
  gravity = if (centered) Gravity.CENTER_HORIZONTAL else Gravity.START
  setPadding(dp(context, 16), dp(context, 16), dp(context, 16), dp(context, 16))
  setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
  setTextColor(if (enabled) color else disabledColor)
  background = AppCompatResources.getDrawable(context, selectableItemBackgroundRes(context))
  isClickable = true
  isFocusable = true
  isEnabled = enabled
  setOnClickListener { onPress() }
  contentDescription = label
  ViewCompat.setAccessibilityDelegate(
    this,
    object : AccessibilityDelegateCompat() {
      override fun onInitializeAccessibilityNodeInfo(
        host: View,
        info: AccessibilityNodeInfoCompat,
      ) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.className = Button::class.java.name
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
