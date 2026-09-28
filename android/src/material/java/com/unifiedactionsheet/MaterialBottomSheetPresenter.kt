package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import android.content.res.ColorStateList
import android.view.View
import android.view.View.MeasureSpec
import android.widget.LinearLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.bottomsheet.BottomSheetBehavior
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

    // Edge to edge is for the bottom only. It would also let a long list
    // expand behind the status bar, so cap the sheet just below it (and any
    // display cutout); the rows scroll inside it instead.
    val decor = activity.window.decorView
    val insets = ViewCompat.getRootWindowInsets(decor)
    val topInset = insets
      ?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      ?.top ?: 0
    val bottomInset = insets?.getInsets(WindowInsetsCompat.Type.navigationBars())?.bottom ?: 0
    if (decor.height > topInset) {
      val maxHeight = decor.height - topInset
      dialog.behavior.maxHeight = maxHeight
      applyDetents(dialog, root, options.detents, decor, maxHeight, bottomInset)
    }

    return dialog
  }

  /// The caller's detents, mapped onto Material's states. Each one becomes a
  /// height: 'auto' the content (plus the navigation bar the sheet now draws
  /// behind), 'medium' half the screen, 'large' everything below the status
  /// bar. The sheet is as tall as the tallest; with two heights the lower one
  /// is the collapsed state, and a third in between is the half-expanded one.
  /// It opens at the first detent listed. None listed keeps Material's own
  /// behavior: a short list fits, a long one peeks and expands.
  private fun applyDetents(
    dialog: BottomSheetDialog,
    root: View,
    detents: List<Detent>,
    decor: View,
    maxHeight: Int,
    bottomInset: Int,
  ) {
    if (detents.isEmpty()) return
    val sheet = dialog.findViewById<View>(MaterialR.id.design_bottom_sheet) ?: return

    root.measure(
      MeasureSpec.makeMeasureSpec(decor.width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(maxHeight, MeasureSpec.AT_MOST),
    )
    val heightOf = detents.associateWith { detent ->
      when (detent) {
        Detent.AUTO -> (root.measuredHeight + bottomInset).coerceAtMost(maxHeight)
        Detent.MEDIUM -> (decor.height / 2).coerceAtMost(maxHeight)
        Detent.LARGE -> maxHeight
      }
    }
    // Equal heights are one resting point, e.g. 'auto' for a list that fills
    // the screen and 'large'.
    val heights = heightOf.values.distinct().sorted()
    val tallest = heights.last()
    val behavior = dialog.behavior

    sheet.layoutParams = sheet.layoutParams.apply { height = tallest }
    // Only three resting points need Material's half-expanded state, which
    // requires fitToContents off.
    behavior.isFitToContents = heights.size < 3
    behavior.skipCollapsed = heights.size == 1
    if (heights.size > 1) {
      // Material adds the navigation bar inset to the peek height itself.
      behavior.peekHeight = heights.first() - bottomInset
    }
    if (heights.size == 3) {
      behavior.halfExpandedRatio = heights[1].toFloat() / decor.height
      behavior.expandedOffset = decor.height - tallest
    }

    val initial = heightOf.getValue(detents.first())
    behavior.state = when {
      initial == tallest -> BottomSheetBehavior.STATE_EXPANDED
      heights.size == 3 && initial == heights[1] -> BottomSheetBehavior.STATE_HALF_EXPANDED
      else -> BottomSheetBehavior.STATE_COLLAPSED
    }
  }

  private fun bottomSheetTheme(isDark: Boolean): Int = if (isDark) {
    R.style.UnifiedActionSheet_BottomSheetDialog_Dark
  } else {
    R.style.UnifiedActionSheet_BottomSheetDialog_Light
  }
}
