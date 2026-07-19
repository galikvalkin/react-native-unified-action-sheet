package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.View.MeasureSpec
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatDialog
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

private const val MAX_HEIGHT_PERCENT = 90

internal interface SheetPresenter {
  fun build(activity: Activity, options: ActionSheetOptions, onSelect: (Dialog, Int) -> Unit): Dialog
}

internal object CenteredDialogPresenter : SheetPresenter {
  private const val CENTERED_CORNER_RADIUS_DP = 28
  private const val CENTERED_MARGIN_DP = 24
  private const val CENTERED_MIN_WIDTH_DP = 280
  private const val CENTERED_MAX_WIDTH_DP = 560

  override fun build(
    activity: Activity,
    options: ActionSheetOptions,
    onSelect: (Dialog, Int) -> Unit,
  ): Dialog {
    val isDark = isDarkAppearance(activity, options.userInterfaceStyle)
    val palette = paletteFor(isDark)
    val dialog = AppCompatDialog(activity, dialogTheme(isDark))
    dialog.supportRequestWindowFeature(Window.FEATURE_NO_TITLE)

    val context: Context = dialog.context
    val container = buildContent(context, options, palette) { index -> onSelect(dialog, index) }

    dialog.setContentView(container)
    dialog.setCanceledOnTouchOutside(true)

    val background = GradientDrawable().apply {
      cornerRadius = dp(context, CENTERED_CORNER_RADIUS_DP).toFloat()
      setColor(palette.surface)
    }
    dialog.window?.setBackgroundDrawable(background)
    container.background = background.constantState?.newDrawable() ?: background
    container.clipToOutline = true

    val metrics = context.resources.displayMetrics
    val width = (metrics.widthPixels - 2 * dp(context, CENTERED_MARGIN_DP))
      .coerceAtMost(dp(context, CENTERED_MAX_WIDTH_DP))
      .coerceAtLeast(minOf(dp(context, CENTERED_MIN_WIDTH_DP), metrics.widthPixels))
    dialog.window?.setLayout(width, WindowManager.LayoutParams.WRAP_CONTENT)

    val maxHeight = (metrics.heightPixels * MAX_HEIGHT_PERCENT) / 100
    container.addOnLayoutChangeListener(object : View.OnLayoutChangeListener {
      override fun onLayoutChange(
        view: View,
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
        oldLeft: Int,
        oldTop: Int,
        oldRight: Int,
        oldBottom: Int,
      ) {
        if (container.height <= maxHeight) return
        container.removeOnLayoutChangeListener(this)
        dialog.window?.setLayout(width, maxHeight)
      }
    })

    return dialog
  }
}

internal class AnchoredDialogPresenter(private val anchorRect: Rect) : SheetPresenter {
  override fun build(
    activity: Activity,
    options: ActionSheetOptions,
    onSelect: (Dialog, Int) -> Unit,
  ): Dialog {
    val isDark = isDarkAppearance(activity, options.userInterfaceStyle)
    val palette = paletteFor(isDark)
    val dialog = AppCompatDialog(activity, dialogTheme(isDark))
    dialog.supportRequestWindowFeature(Window.FEATURE_NO_TITLE)

    val context: Context = dialog.context
    val container = buildContent(context, options, palette, includeCancelRow = false) { index ->
      onSelect(dialog, index)
    }

    container.background = GradientDrawable().apply {
      cornerRadius = dp(context, ANCHORED_CORNER_RADIUS_DP).toFloat()
      setColor(palette.surface)
    }
    container.clipToOutline = true
    container.elevation = dp(context, ANCHORED_ELEVATION_DP).toFloat()

    val pad = dp(context, SHADOW_PADDING_DP)
    val wrapper = FrameLayout(context).apply {
      setPadding(pad, pad, pad, pad)
      clipChildren = false
      clipToPadding = false
      addView(
        container,
        FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.MATCH_PARENT,
        ),
      )
    }
    dialog.setContentView(wrapper)
    dialog.setCanceledOnTouchOutside(true)

    val window = dialog.window ?: return dialog
    window.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
    window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
    window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN)
    window.setGravity(Gravity.TOP or Gravity.LEFT)

    // The rect arrives in the activity content view's space, which sits below
    // the status bar unless the app is edge to edge, while this window is laid
    // out in screen space. Offset by the content view's position to line up.
    val anchorOnScreen = Rect(anchorRect).apply {
      val offset = IntArray(2)
      activity.findViewById<View>(android.R.id.content)?.getLocationOnScreen(offset)
      offset(offset[0], offset[1])
    }

    val decor = activity.window.decorView
    val insets = ViewCompat.getRootWindowInsets(decor)?.getInsets(
      WindowInsetsCompat.Type.systemBars() or
        WindowInsetsCompat.Type.displayCutout() or
        WindowInsetsCompat.Type.ime(),
    ) ?: Insets.NONE
    val margin = dp(context, EDGE_MARGIN_DP)
    val usable = Rect(
      insets.left + margin,
      insets.top + margin,
      decor.width - insets.right - margin,
      decor.height - insets.bottom - margin,
    )

    val maxWidth = minOf(dp(context, ANCHORED_MAX_WIDTH_DP), usable.width())
    container.measure(
      MeasureSpec.makeMeasureSpec(maxWidth, MeasureSpec.AT_MOST),
      MeasureSpec.makeMeasureSpec(usable.height(), MeasureSpec.AT_MOST),
    )
    val width = container.measuredWidth
      .coerceIn(minOf(dp(context, ANCHORED_MIN_WIDTH_DP), maxWidth), maxWidth)
    container.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(usable.height(), MeasureSpec.AT_MOST),
    )
    val desiredHeight = container.measuredHeight

    val gap = dp(context, ANCHOR_GAP_DP)
    val spaceBelow = usable.bottom - (anchorOnScreen.bottom + gap)
    val spaceAbove = (anchorOnScreen.top - gap) - usable.top
    var height = desiredHeight
    var y = anchorOnScreen.bottom + gap
    if (desiredHeight > spaceBelow) {
      if (desiredHeight <= spaceAbove) {
        y = anchorOnScreen.top - gap - desiredHeight
      } else {
        height = minOf(desiredHeight, maxOf(spaceBelow, spaceAbove))
          .coerceAtLeast(minOf(desiredHeight, dp(context, ANCHORED_MIN_HEIGHT_DP)))
        y = if (spaceBelow >= spaceAbove) {
          anchorOnScreen.bottom + gap
        } else {
          anchorOnScreen.top - gap - height
        }
      }
    }
    y = y.coerceIn(usable.top, maxOf(usable.top, usable.bottom - height))

    val rtl =
      context.resources.configuration.layoutDirection == View.LAYOUT_DIRECTION_RTL
    val x = when {
      options.anchorAlignment == AnchorAlignment.CENTER -> anchorOnScreen.centerX() - width / 2
      rtl -> anchorOnScreen.right - width
      else -> anchorOnScreen.left
    }.coerceIn(usable.left, maxOf(usable.left, usable.right - width))

    val attributes = window.attributes
    attributes.x = x - pad
    attributes.y = y - pad
    window.attributes = attributes
    window.setLayout(width + 2 * pad, height + 2 * pad)

    return dialog
  }

  private companion object {
    const val ANCHORED_MIN_WIDTH_DP = 180
    const val ANCHORED_MAX_WIDTH_DP = 280
    const val ANCHORED_MIN_HEIGHT_DP = 96
    const val ANCHORED_CORNER_RADIUS_DP = 8
    const val ANCHORED_ELEVATION_DP = 3
    const val SHADOW_PADDING_DP = 8
    const val EDGE_MARGIN_DP = 8
    const val ANCHOR_GAP_DP = 4
  }
}
