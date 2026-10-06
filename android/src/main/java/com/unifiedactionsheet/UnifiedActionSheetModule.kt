package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
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

  override fun showActionSheetWithOptions(options: ReadableMap, onShow: Callback, promise: Promise) {
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
      // The activity can start finishing between this call and the UI thread
      // getting to it, e.g. on back or a navigation reset. A dialog shown then
      // leaks its window or crashes with BadTokenException, so skip it.
      if (activity.isClosing()) return@runOnUiThread promise.resolve(DISMISSED_BY_API)
      presentSheet(activity, parsed, onShow, promise)
    }
  }

  override fun showPromptWithOptions(options: ReadableMap, onShow: Callback, promise: Promise) {
    val parsed = PromptOptions.fromReadableMap(options)
    val activity = reactApplicationContext.currentActivity
      ?: return promise.reject(
        "E_NO_ACTIVITY",
        "No current activity to attach the prompt to.",
      )

    UiThreadUtil.runOnUiThread {
      // As in showActionSheetWithOptions.
      if (activity.isClosing()) {
        return@runOnUiThread promise.resolve(
          Arguments.createMap().apply {
            putInt("buttonIndex", DISMISSED_BY_API)
            putString("text", parsed.defaultValue ?: "")
            putString("password", "")
          },
        )
      }
      presentPrompt(activity, parsed, onShow, promise)
    }
  }

  override fun getTypedExportedConstants(): MutableMap<String, Any> =
    mutableMapOf("isMaterialEnabled" to BottomSheetPresenterFactory.isAvailable)

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
    // Called on the UI thread: dismiss right away, while the activity's window
    // still exists, rather than after it is gone.
    if (UiThreadUtil.isOnUiThread()) {
      dismissAllOpenDialogs()
    } else {
      UiThreadUtil.runOnUiThread { dismissAllOpenDialogs() }
    }
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
    onShow: Callback,
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
      // Without Material compiled in there is no bottom sheet; JS has already
      // warned in development, from the isMaterialEnabled constant.
      PresentationStyle.BOTTOM -> BottomSheetPresenterFactory.create() ?: CenteredDialogPresenter
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
    dialog.callOnceWhenShown(onShow)
    dialog.applyCancelable(options)

    dialog.show()
  }

  /// Mirrors presentSheet exactly, except the resolved value carries the text
  /// as well as the index. The dialog joins the same openDialogs registry, so
  /// dismissActionSheet()/dismissAllActionSheets() close prompts too.
  private fun presentPrompt(
    activity: Activity,
    options: PromptOptions,
    onShow: Callback,
    promise: Promise,
  ) {
    val resolved = AtomicBoolean(false)
    val resolveOnce: (Int?, PromptValues) -> Unit = { index, values ->
      if (resolved.compareAndSet(false, true)) {
        promise.resolve(
          Arguments.createMap().apply {
            putInt("buttonIndex", index ?: -1)
            putString("text", values.text)
            putString("password", values.password)
          },
        )
      }
    }

    val (dialog, currentValues) = buildPromptDialog(activity, options) { presented, index, values ->
      presented.dismiss()
      resolveOnce(index, values)
    }
    openDialogs.add(dialog)

    // Read the field at dismissal time: what the user typed survives a backdrop
    // tap, so a caller can still recover a draft.
    dialog.setOnCancelListener { resolveOnce(options.cancelButtonIndex, currentValues()) }
    dialog.setOnDismissListener {
      openDialogs.remove(dialog)
      if (dismissedByApi.remove(dialog)) {
        resolveOnce(DISMISSED_BY_API, currentValues())
      } else {
        resolveOnce(options.cancelButtonIndex, currentValues())
      }
    }
    dialog.callOnceWhenShown(onShow)
    dialog.applyCancelable(options)

    dialog.show()
  }

  private fun Activity.isClosing(): Boolean = isFinishing || isDestroyed

  /// Last, after the presenter: Dialog.setCanceledOnTouchOutside(true), which
  /// every presenter calls, turns cancelable back on. On Material's bottom
  /// sheet, setCancelable(false) also stops the swipe down from hiding it.
  private fun Dialog.applyCancelable(options: SheetContent) {
    setCancelable(options.isCancelable)
  }

  /// onShow: once the dialog's window is shown. A React Native Callback throws
  /// if invoked twice, hence the guard. A dialog that is never shown (the
  /// no-activity path rejects before building one) never calls it.
  private fun Dialog.callOnceWhenShown(onShow: Callback) {
    val shown = AtomicBoolean(false)
    setOnShowListener {
      if (shown.compareAndSet(false, true)) onShow.invoke()
    }
  }

  companion object {
    const val NAME = NativeUnifiedActionSheetSpec.NAME

    private const val DISMISSED_BY_API = -2
  }
}
