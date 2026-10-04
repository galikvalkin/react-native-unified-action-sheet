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
  val content: SheetContentOptions,
  val type: PromptType = PromptType.PLAIN_TEXT,
  val placeholder: String? = null,
  val passwordPlaceholder: String? = null,
  val defaultValue: String? = null,
  val keyboardType: PromptKeyboardType = PromptKeyboardType.DEFAULT,
  /// End-to-end ids for its field and its password field.
  val fieldTestID: String? = null,
  val passwordFieldTestID: String? = null,
) : SheetContent by content {
  companion object {
    fun fromReadableMap(map: ReadableMap) = PromptOptions(
      content = SheetContentOptions.fromReadableMap(map),
      type = PromptType.fromWire(map.optString("type")),
      placeholder = map.optString("placeholder"),
      passwordPlaceholder = map.optString("passwordPlaceholder"),
      defaultValue = map.optString("defaultValue"),
      keyboardType = PromptKeyboardType.fromWire(map.optString("keyboardType")),
      fieldTestID = map.optString("fieldTestID")?.takeIf { it.isNotEmpty() },
      passwordFieldTestID = map.optString("passwordFieldTestID")?.takeIf { it.isNotEmpty() },
    )
  }
}
