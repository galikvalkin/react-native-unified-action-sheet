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

internal data class ActionSheetOptions(
  val options: List<String>,
  val cancelButtonIndex: Int?,
  val destructiveButtonIndices: Set<Int>,
  val title: String?,
  val message: String?,
  val tintColor: String?,
  val cancelButtonTintColor: String?,
  val destructiveColor: String?,
  val buttonTextAlignment: ButtonTextAlignment,
  val disabledButtonIndices: Set<Int>,
  val userInterfaceStyle: ForcedAppearance,
  val presentationStyle: PresentationStyle,
  val anchorRect: Rect?,
  val anchorAlignment: AnchorAlignment,
  /// Bold, as the default action. Only the first preferred button counts.
  val preferredButtonIndex: Int? = null,
  /// 'bottom' only, in the caller's order: the sheet opens at the first.
  val detents: List<Detent> = emptyList(),
  /// Aligned with options; null where a button has none.
  val testIDs: List<String?> = emptyList(),
  /// Same alignment: spoken instead of the label, and after it.
  val accessibilityLabels: List<String?> = emptyList(),
  val accessibilityHints: List<String?> = emptyList(),
  /// The sheet's own id for end-to-end tests, on its dialog content.
  val testID: String? = null,
) {
  /// For TalkBack: names the dialog window when it opens. The dialogs draw
  /// their own header, so this sets no visible title bar.
  val windowTitle: String?
    get() = title?.takeIf { it.isNotBlank() } ?: message?.takeIf { it.isNotBlank() }

  companion object {
    /// density converts the anchor rect: measureInWindow reports dp, while
    /// View coordinates are px.
    fun fromReadableMap(map: ReadableMap, density: Float): ActionSheetOptions {
      val labels = mutableListOf<String>()
      map.getArray("options")?.let { array ->
        for (index in 0 until array.size()) {
          array.getString(index)?.let(labels::add)
        }
      }

      val disabledIndices = mutableSetOf<Int>()
      map.getArray("disabledButtonIndices")?.let { array ->
        for (index in 0 until array.size()) {
          disabledIndices.add(array.getInt(index))
        }
      }

      val destructiveIndices = mutableSetOf<Int>()
      map.getArray("destructiveButtonIndices")?.let { array ->
        for (index in 0 until array.size()) {
          destructiveIndices.add(array.getInt(index))
        }
      }

      return ActionSheetOptions(
        options = labels,
        cancelButtonIndex = optInt(map, "cancelButtonIndex"),
        destructiveButtonIndices = destructiveIndices,
        title = optString(map, "title"),
        message = optString(map, "message"),
        tintColor = optString(map, "tintColor"),
        cancelButtonTintColor = optString(map, "cancelButtonTintColor"),
        destructiveColor = optString(map, "destructiveColor"),
        buttonTextAlignment = ButtonTextAlignment.fromWire(optString(map, "buttonTextAlignment")),
        disabledButtonIndices = disabledIndices,
        userInterfaceStyle = ForcedAppearance.fromWire(optString(map, "userInterfaceStyle")),
        presentationStyle = PresentationStyle.fromWire(optString(map, "presentationStyle")),
        anchorRect = optRect(map, "anchorRect", density),
        anchorAlignment = AnchorAlignment.fromWire(optString(map, "anchorAlignment")),
        preferredButtonIndex = optInt(map, "preferredButtonIndex"),
        detents = optDetents(map),
        testIDs = optAligned(map, "testIDs"),
        accessibilityLabels = optAligned(map, "accessibilityLabels"),
        accessibilityHints = optAligned(map, "accessibilityHints"),
        testID = optString(map, "testID")?.takeIf { it.isNotEmpty() },
      )
    }

    /// A per-button array (testIDs, accessibilityLabels, accessibilityHints).
    /// The wire sends '' for a button without a value.
    fun optAligned(map: ReadableMap, key: String): List<String?> {
      val values = mutableListOf<String?>()
      map.getArray(key)?.let { array ->
        for (index in 0 until array.size()) {
          values.add(array.getString(index)?.takeIf { it.isNotEmpty() })
        }
      }

      return values
    }

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

    private fun optInt(map: ReadableMap, key: String): Int? =
      if (map.hasKey(key) && !map.isNull(key)) map.getInt(key) else null

    private fun optString(map: ReadableMap, key: String): String? =
      if (map.hasKey(key) && !map.isNull(key)) map.getString(key) else null
  }
}
