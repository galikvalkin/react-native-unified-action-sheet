package com.unifiedactionsheet

import android.text.InputType
import com.facebook.react.bridge.ReadableMap

/// The subset of React Native's keyboardType values that map onto both
/// platforms. Anything unrecognised falls back to the plain text keyboard.
internal enum class PromptKeyboardType {
  DEFAULT,
  EMAIL_ADDRESS,
  NUMERIC,
  PHONE_PAD,
  URL,
  ;

  fun toInputType(secure: Boolean): Int {
    if (secure) {
      // Keep the keyboard class: masking a passcode should still show digits.
      return when (this) {
        NUMERIC, PHONE_PAD ->
          InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        else -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
      }
    }

    return when (this) {
      DEFAULT -> InputType.TYPE_CLASS_TEXT
      EMAIL_ADDRESS -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
      NUMERIC -> InputType.TYPE_CLASS_NUMBER
      PHONE_PAD -> InputType.TYPE_CLASS_PHONE
      URL -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
    }
  }

  companion object {
    fun fromWire(value: String?): PromptKeyboardType = when (value) {
      "email-address" -> EMAIL_ADDRESS
      "numeric" -> NUMERIC
      "phone-pad" -> PHONE_PAD
      "url" -> URL
      else -> DEFAULT
    }
  }
}

/// As in React Native's Alert.prompt. LOGIN_PASSWORD adds a secure field below
/// the first.
internal enum class PromptType {
  PLAIN_TEXT,
  SECURE_TEXT,
  LOGIN_PASSWORD,
  ;

  companion object {
    fun fromWire(value: String?): PromptType = when (value) {
      "secure-text" -> SECURE_TEXT
      "login-password" -> LOGIN_PASSWORD
      else -> PLAIN_TEXT
    }
  }
}

internal data class PromptOptions(
  val options: List<String>,
  val cancelButtonIndex: Int?,
  val destructiveButtonIndices: Set<Int>,
  val disabledButtonIndices: Set<Int>,
  val title: String?,
  val message: String?,
  val type: PromptType,
  val placeholder: String?,
  val passwordPlaceholder: String?,
  val defaultValue: String?,
  val keyboardType: PromptKeyboardType,
  val preferredButtonIndex: Int?,
  /// Buttons kept disabled while any field is empty.
  val textRequiredButtonIndices: Set<Int>,
  val testIDs: List<String?>,
  val accessibilityLabels: List<String?>,
  val accessibilityHints: List<String?>,
  /// End-to-end ids: the prompt itself, its field, its password field.
  val testID: String?,
  val fieldTestID: String?,
  val passwordFieldTestID: String?,
  val tintColor: Int?,
  val cancelButtonTintColor: Int?,
  val destructiveColor: Int?,
  val buttonTextAlignment: ButtonTextAlignment,
  val userInterfaceStyle: ForcedAppearance,
) {
  /// The prompt reuses the sheet's content and dialog code, which are written
  /// against ActionSheetOptions. Presentation is fixed to centered: UIKit has
  /// no text field in an action sheet, so an anchored prompt has no iOS
  /// counterpart and would break the "same options behave the same way" rule.
  fun toSheetOptions(): ActionSheetOptions = ActionSheetOptions(
    options = options,
    cancelButtonIndex = cancelButtonIndex,
    destructiveButtonIndices = destructiveButtonIndices,
    title = title,
    message = message,
    tintColor = tintColor,
    cancelButtonTintColor = cancelButtonTintColor,
    destructiveColor = destructiveColor,
    buttonTextAlignment = buttonTextAlignment,
    disabledButtonIndices = disabledButtonIndices,
    userInterfaceStyle = userInterfaceStyle,
    presentationStyle = PresentationStyle.CENTERED,
    anchorRect = null,
    anchorAlignment = AnchorAlignment.START,
    preferredButtonIndex = preferredButtonIndex,
    testIDs = testIDs,
    accessibilityLabels = accessibilityLabels,
    accessibilityHints = accessibilityHints,
    testID = testID,
  )

  companion object {
    fun fromReadableMap(map: ReadableMap): PromptOptions {
      val labels = mutableListOf<String>()
      map.getArray("options")?.let { array ->
        for (index in 0 until array.size()) {
          array.getString(index)?.let(labels::add)
        }
      }

      return PromptOptions(
        options = labels,
        cancelButtonIndex = optInt(map, "cancelButtonIndex"),
        destructiveButtonIndices = optIndices(map, "destructiveButtonIndices"),
        disabledButtonIndices = optIndices(map, "disabledButtonIndices"),
        title = optString(map, "title"),
        message = optString(map, "message"),
        type = PromptType.fromWire(optString(map, "type")),
        placeholder = optString(map, "placeholder"),
        passwordPlaceholder = optString(map, "passwordPlaceholder"),
        defaultValue = optString(map, "defaultValue"),
        keyboardType = PromptKeyboardType.fromWire(optString(map, "keyboardType")),
        preferredButtonIndex = optInt(map, "preferredButtonIndex"),
        textRequiredButtonIndices = optIndices(map, "textRequiredButtonIndices"),
        testIDs = ActionSheetOptions.optAligned(map, "testIDs"),
        accessibilityLabels = ActionSheetOptions.optAligned(map, "accessibilityLabels"),
        accessibilityHints = ActionSheetOptions.optAligned(map, "accessibilityHints"),
        testID = optString(map, "testID")?.takeIf { it.isNotEmpty() },
        fieldTestID = optString(map, "fieldTestID")?.takeIf { it.isNotEmpty() },
        passwordFieldTestID = optString(map, "passwordFieldTestID")?.takeIf { it.isNotEmpty() },
        tintColor = optColor(map, "tintColor"),
        cancelButtonTintColor = optColor(map, "cancelButtonTintColor"),
        destructiveColor = optColor(map, "destructiveColor"),
        buttonTextAlignment = ButtonTextAlignment.fromWire(optString(map, "buttonTextAlignment")),
        userInterfaceStyle = ForcedAppearance.fromWire(optString(map, "userInterfaceStyle")),
      )
    }

    private fun optIndices(map: ReadableMap, key: String): Set<Int> {
      val indices = mutableSetOf<Int>()
      map.getArray(key)?.let { array ->
        for (index in 0 until array.size()) {
          indices.add(array.getInt(index))
        }
      }

      return indices
    }

    private fun optInt(map: ReadableMap, key: String): Int? =
      if (map.hasKey(key) && !map.isNull(key)) map.getInt(key) else null

    /// A color processed by React Native's processColor: an ARGB number. Read
    /// as a double and truncated to 32 bits, so an unsigned value works too.
    private fun optColor(map: ReadableMap, key: String): Int? =
      if (map.hasKey(key) && !map.isNull(key)) map.getDouble(key).toLong().toInt() else null

    private fun optString(map: ReadableMap, key: String): String? =
      if (map.hasKey(key) && !map.isNull(key)) map.getString(key) else null
  }
}
