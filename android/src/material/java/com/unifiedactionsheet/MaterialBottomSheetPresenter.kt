package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import android.content.res.ColorStateList
import android.view.View
import android.widget.LinearLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDragHandleView
import com.google.android.material.R as MaterialR

/// presentationStyle 'bottom': a Material 3 modal bottom sheet. Material's own
/// behavior does the rest: a long list opens at the peek height and drags up to
/// expand, a short one opens fully, and swiping it away cancels the dialog, so
/// it resolves through the same cancel path as a backdrop tap.
internal object MaterialBottomSheetPresenter : SheetPresenter {
  override fun build(
    activity: Activity,
    options: ActionSheetOptions,
    onSelect: (Dialog, Int) -> Unit,
  ): Dialog {
    val isDark = isDarkAppearance(activity, options.userInterfaceStyle)
    val palette = paletteFor(isDark)
    // A full Material 3 theme rather than an overlay, so the sheet works inside
    // an app whose own theme is plain AppCompat.
    val dialog = BottomSheetDialog(activity, bottomSheetTheme(isDark))

    val context = dialog.context
    // The cancel row stays the last row, as on the centered dialog. With a long
    // list it starts below the peek height, which Material users expect:
    // swipe down, back and a backdrop tap all resolve the cancel index anyway.
    val content = buildContent(context, options, palette) { index -> onSelect(dialog, index) }

    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      addView(
        BottomSheetDragHandleView(context),
        LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ),
      )
      addView(
        content,
        LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT,
        ),
      )
    }
    dialog.setContentView(root)
    dialog.setCanceledOnTouchOutside(true)

    // Tint Material's own sheet background instead of replacing it, so its
    // rounded top corners and expansion animation stay intact, while the color
    // matches the palette the centered and anchored styles use.
    dialog.findViewById<View>(MaterialR.id.design_bottom_sheet)?.let { sheet ->
      ViewCompat.setBackgroundTintList(sheet, ColorStateList.valueOf(palette.surface))
    }

    // The sheet now sits behind the navigation bar, so its buttons or gesture
    // handle need to contrast with the sheet, not with the app underneath.
    dialog.window?.let { window ->
      WindowCompat.getInsetsController(window, window.decorView)
        .isAppearanceLightNavigationBars = !isDark
    }

    return dialog
  }

  private fun bottomSheetTheme(isDark: Boolean): Int = if (isDark) {
    R.style.UnifiedActionSheet_BottomSheetDialog_Dark
  } else {
    R.style.UnifiedActionSheet_BottomSheetDialog_Light
  }
}
