package com.unifiedactionsheet

import android.graphics.Rect
import com.facebook.react.bridge.ReadableMap

internal enum class PresentationStyle {
  CENTERED,
  ANCHORED,
  BOTTOM,
  ;

  companion object {
    fun fromWire(value: String?): PresentationStyle = when (value) {
      "anchored" -> ANCHORED
      "bottom" -> BOTTOM
      else -> CENTERED
    }
  }
}

internal enum class ButtonTextAlignment {
  START,
  CENTER,
  ;

  companion object {
    fun fromWire(value: String?): ButtonTextAlignment =
      if (value == "center") CENTER else START
  }
}

internal enum class AnchorAlignment {
  START,
  CENTER,
  ;

  companion object {
    fun fromWire(value: String?): AnchorAlignment =
      if (value == "center") CENTER else START
  }
}

/// A bottom sheet's resting height: the content, half the screen, or the full
/// height below the status bar.
internal enum class Detent {
  AUTO,
  MEDIUM,
  LARGE,
  ;

  companion object {
    fun fromWire(value: String?): Detent? = when (value) {
      "auto" -> AUTO
      "medium" -> MEDIUM
      "large" -> LARGE
      else -> null
    }
  }
}

internal enum class ForcedAppearance {
  SYSTEM,
  LIGHT,
  DARK,
  ;

  companion object {
    fun fromWire(value: String?): ForcedAppearance = when (value) {
      "light" -> LIGHT
      "dark" -> DARK
      else -> SYSTEM
    }
  }
}

/// One button, in display order. Its position in SheetContent.buttons is the
/// index the promise resolves with.
internal data class SheetButton(
  val label: String,
  /// At most one per sheet: JS keeps only the first button styled 'cancel'.
  val isCancel: Boolean = false,
  val isDestructive: Boolean = false,
  val isDisabled: Boolean = false,
  /// Bold, as the default action. At most one, as with isCancel.
  val isPreferred: Boolean = false,
  /// For end-to-end tests: the row's tag and accessibility resource id.
  val testID: String? = null,
  /// Spoken instead of the label, and after it.
  val accessibilityLabel: String? = null,
  val accessibilityHint: String? = null,
  /// Prompts only: kept disabled while any field is empty.
  val requiresText: Boolean = false,
) {
  companion object {
    fun fromReadableMap(map: ReadableMap) = SheetButton(
      label = map.optString("label").orEmpty(),
      isCancel = map.optString("style") == "cancel",
      isDestructive = map.optString("style") == "destructive",
      isDisabled = map.optBoolean("disabled"),
      isPreferred = map.optBoolean("preferred"),
      testID = map.optString("testID")?.takeIf { it.isNotEmpty() },
      accessibilityLabel = map.optString("accessibilityLabel")?.takeIf { it.isNotEmpty() },
      accessibilityHint = map.optString("accessibilityHint")?.takeIf { it.isNotEmpty() },
      requiresText = map.optBoolean("requiresText"),
    )
  }
}

/// What a sheet and a prompt have in common: the header, the buttons and how
/// they look. buildContent draws from this alone, so the two cannot drift.
internal interface SheetContent {
  val title: String?
  val message: String?
  val buttons: List<SheetButton>
  val tintColor: Int?
  val cancelButtonTintColor: Int?
  val destructiveColor: Int?
  val buttonTextAlignment: ButtonTextAlignment
  val userInterfaceStyle: ForcedAppearance
  /// The sheet's own id for end-to-end tests, on its dialog content.
  val testID: String?
  /// false: back, a backdrop tap and a swipe down do nothing; only a button
  /// (or dismissActionSheet()) closes it.
  val isCancelable: Boolean

  /// The cancel button's index, or null without one: what a backdrop tap or
  /// back resolves with.
  val cancelButtonIndex: Int?
    get() = buttons.indexOfFirst { it.isCancel }.takeIf { it >= 0 }

  /// For TalkBack: names the dialog window when it opens. The dialogs draw
  /// their own header, so this sets no visible title bar.
  val windowTitle: String?
    get() = title?.takeIf { it.isNotBlank() } ?: message?.takeIf { it.isNotBlank() }
}

internal data class SheetContentOptions(
  override val title: String? = null,
  override val message: String? = null,
  override val buttons: List<SheetButton> = emptyList(),
  override val tintColor: Int? = null,
  override val cancelButtonTintColor: Int? = null,
  override val destructiveColor: Int? = null,
  override val buttonTextAlignment: ButtonTextAlignment = ButtonTextAlignment.START,
  override val userInterfaceStyle: ForcedAppearance = ForcedAppearance.SYSTEM,
  override val testID: String? = null,
  override val isCancelable: Boolean = true,
) : SheetContent {
  companion object {
    fun fromReadableMap(map: ReadableMap): SheetContentOptions {
      val buttons = mutableListOf<SheetButton>()
      map.getArray("buttons")?.let { array ->
        for (index in 0 until array.size()) {
          array.getMap(index)?.let { buttons.add(SheetButton.fromReadableMap(it)) }
        }
      }

      return SheetContentOptions(
        title = map.optString("title"),
        message = map.optString("message"),
        buttons = buttons,
        tintColor = map.optColor("tintColor"),
        cancelButtonTintColor = map.optColor("cancelButtonTintColor"),
        destructiveColor = map.optColor("destructiveColor"),
        buttonTextAlignment = ButtonTextAlignment.fromWire(map.optString("buttonTextAlignment")),
        userInterfaceStyle = ForcedAppearance.fromWire(map.optString("userInterfaceStyle")),
        testID = map.optString("testID")?.takeIf { it.isNotEmpty() },
        // Absent means cancelable, as in React Native's Alert.
        isCancelable = !map.hasKey("cancelable") || map.isNull("cancelable") || map.getBoolean("cancelable"),
      )
    }
  }
}

internal data class ActionSheetOptions(
  val content: SheetContentOptions,
  val presentationStyle: PresentationStyle = PresentationStyle.CENTERED,
  val anchorRect: Rect? = null,
  val anchorAlignment: AnchorAlignment = AnchorAlignment.START,
  /// 'bottom' only, in the caller's order: the sheet opens at the first.
  val detents: List<Detent> = emptyList(),
) : SheetContent by content {
  companion object {
    /// density converts the anchor rect: measureInWindow reports dp, while
    /// View coordinates are px.
    fun fromReadableMap(map: ReadableMap, density: Float) = ActionSheetOptions(
      content = SheetContentOptions.fromReadableMap(map),
      presentationStyle = PresentationStyle.fromWire(map.optString("presentationStyle")),
      anchorRect = optRect(map, "anchorRect", density),
      anchorAlignment = AnchorAlignment.fromWire(map.optString("anchorAlignment")),
      detents = optDetents(map),
    )

    private fun optDetents(map: ReadableMap): List<Detent> {
      val detents = mutableListOf<Detent>()
      map.getArray("detents")?.let { array ->
        for (index in 0 until array.size()) {
          Detent.fromWire(array.getString(index))?.let(detents::add)
        }
      }

      return detents.distinct()
    }

    private fun optRect(map: ReadableMap, key: String, density: Float): Rect? {
      if (!map.hasKey(key) || map.isNull(key)) return null
      val rect = map.getMap(key) ?: return null

      val x = rect.getDouble("x") * density
      val y = rect.getDouble("y") * density

      return Rect(
        x.toInt(),
        y.toInt(),
        (x + rect.getDouble("width") * density).toInt(),
        (y + rect.getDouble("height") * density).toInt(),
      )
    }
  }
}

internal fun ReadableMap.optString(key: String): String? =
  if (hasKey(key) && !isNull(key)) getString(key) else null

internal fun ReadableMap.optBoolean(key: String): Boolean =
  hasKey(key) && !isNull(key) && getBoolean(key)

/// A color processed by React Native's processColor: an ARGB number. Read as a
/// double and truncated to 32 bits, so an unsigned value works too.
internal fun ReadableMap.optColor(key: String): Int? =
  if (hasKey(key) && !isNull(key)) getDouble(key).toLong().toInt() else null
