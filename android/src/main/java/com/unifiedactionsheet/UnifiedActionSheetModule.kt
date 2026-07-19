package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import java.util.concurrent.atomic.AtomicBoolean

class UnifiedActionSheetModule(reactContext: ReactApplicationContext) :
  NativeUnifiedActionSheetSpec(reactContext), LifecycleEventListener {

  init {
    reactContext.addLifecycleEventListener(this)
  }

  private val openDialogs = mutableListOf<Dialog>()

  private val dismissedByApi = mutableSetOf<Dialog>()

  override fun showActionSheetWithOptions(options: ReadableMap, promise: Promise) {
    val parsed =
      ActionSheetOptions.fromReadableMap(
        options,
        reactApplicationContext.resources.displayMetrics.density,
      )
    val activity = reactApplicationContext.currentActivity
      ?: return promise.reject(
        "E_NO_ACTIVITY",
        "No current activity to attach the action sheet to.",
      )

    UiThreadUtil.runOnUiThread {
      presentSheet(activity, parsed, promise)
    }
  }

  override fun dismissActionSheet() {
    UiThreadUtil.runOnUiThread {
      openDialogs.lastOrNull()?.let { dialog ->
        dismissedByApi.add(dialog)
        dialog.dismiss()
      }
    }
  }

  override fun dismissAllActionSheets() {
    UiThreadUtil.runOnUiThread {
      openDialogs.toList().forEach { dialog ->
        dismissedByApi.add(dialog)
        dialog.dismiss()
      }
    }
  }

  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    UiThreadUtil.runOnUiThread { dismissAllOpenDialogs() }
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    UiThreadUtil.runOnUiThread { dismissAllOpenDialogs() }
    super.invalidate()
  }

  private fun dismissAllOpenDialogs() {
    openDialogs.toList().forEach { it.dismiss() }
    openDialogs.clear()
    dismissedByApi.clear()
  }

  private fun presentSheet(
    activity: Activity,
    options: ActionSheetOptions,
    promise: Promise,
  ) {
    val resolved = AtomicBoolean(false)
    val resolveOnce: (Int?) -> Unit = { index ->
      if (resolved.compareAndSet(false, true)) {
        promise.resolve(index ?: -1)
      }
    }

    val presenter: SheetPresenter = when (options.presentationStyle) {
      PresentationStyle.CENTERED -> CenteredDialogPresenter
      PresentationStyle.ANCHORED -> {
        val rect = options.anchorRect
        if (rect != null && rect.width() > 0 && rect.height() > 0) {
          AnchoredDialogPresenter(rect)
        } else {
          CenteredDialogPresenter
        }
      }
    }

    val dialog = presenter.build(activity, options) { presented, index ->
      presented.dismiss()
      resolveOnce(index)
    }
    openDialogs.add(dialog)

    dialog.setOnCancelListener { resolveOnce(options.cancelButtonIndex) }
    dialog.setOnDismissListener {
      openDialogs.remove(dialog)
      if (dismissedByApi.remove(dialog)) {
        resolveOnce(DISMISSED_BY_API)
      } else {
        resolveOnce(options.cancelButtonIndex)
      }
    }

    dialog.show()
  }

  companion object {
    const val NAME = NativeUnifiedActionSheetSpec.NAME

    private const val DISMISSED_BY_API = -2
  }
}
