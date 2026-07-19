package com.unifiedactionsheet

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.util.TypedValue
import androidx.appcompat.R as AppCompatR

internal data class SheetPalette(
  val primaryText: Int,
  val secondaryText: Int,
  val error: Int,
  val surface: Int,
)

private val LIGHT_PALETTE = SheetPalette(
  primaryText = 0xFF1D1B20.toInt(),
  secondaryText = 0xFF49454F.toInt(),
  error = 0xFFB3261E.toInt(),
  surface = 0xFFECE6F0.toInt(),
)

private val DARK_PALETTE = SheetPalette(
  primaryText = 0xFFE6E0E9.toInt(),
  secondaryText = 0xFFCAC4D0.toInt(),
  error = 0xFFF2B8B5.toInt(),
  surface = 0xFF2B2930.toInt(),
)

internal fun isDarkAppearance(activity: Activity, appearance: ForcedAppearance): Boolean =
  when (appearance) {
    ForcedAppearance.LIGHT -> false
    ForcedAppearance.DARK -> true
    ForcedAppearance.SYSTEM -> {
      val nightMode = activity.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
      nightMode == Configuration.UI_MODE_NIGHT_YES
    }
  }

internal fun dialogTheme(isDark: Boolean): Int = if (isDark) {
  AppCompatR.style.Theme_AppCompat_Dialog
} else {
  AppCompatR.style.Theme_AppCompat_Light_Dialog
}

internal fun paletteFor(isDark: Boolean): SheetPalette = if (isDark) DARK_PALETTE else LIGHT_PALETTE

internal fun selectableItemBackgroundRes(context: Context): Int {
  val outValue = TypedValue()
  context.theme.resolveAttribute(android.R.attr.selectableItemBackground, outValue, true)

  return outValue.resourceId
}

internal fun dp(context: Context, value: Int): Int =
  (value * context.resources.displayMetrics.density).toInt()
