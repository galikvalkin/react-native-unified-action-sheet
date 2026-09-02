package com.unifiedactionsheet

import android.app.Activity
import android.app.Dialog
import com.facebook.react.bridge.Arguments
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

  override fun showPromptWithOptions(options: ReadableMap, promise: Promise) {
    val parsed = PromptOptions.fromReadableMap(options)
    val activity = reactApplicationContext.currentActivity
      ?: return promise.reject(
        "E_NO_ACTIVITY",
        "No current activity to attach the prompt to.",
      )

    UiThreadUtil.runOnUiThread {
      presentPrompt(activity, parsed, promise)
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

  /// Mirrors presentSheet exactly, except the resolved value carries the text
  /// as well as the index. The dialog joins the same openDialogs registry, so
  /// dismissActionSheet()/dismissAllActionSheets() close prompts too.
  private fun presentPrompt(
    activity: Activity,
    options: PromptOptions,
    promise: Promise,
  ) {
    val resolved = AtomicBoolean(false)
    val resolveOnce: (Int?, String) -> Unit = { index, text ->
      if (resolved.compareAndSet(false, true)) {
        promise.resolve(
          Arguments.createMap().apply {
            putInt("buttonIndex", index ?: -1)
            putString("text", text)
          },
        )
      }
    }

    val (dialog, currentText) = buildPromptDialog(activity, options) { presented, index, text ->
      presented.dismiss()
      resolveOnce(index, text)
    }
    openDialogs.add(dialog)

    // Read the field at dismissal time: what the user typed survives a backdrop
    // tap, so a caller can still recover a draft.
    dialog.setOnCancelListener { resolveOnce(options.cancelButtonIndex, currentText()) }
    dialog.setOnDismissListener {
      openDialogs.remove(dialog)
      if (dismissedByApi.remove(dialog)) {
        resolveOnce(DISMISSED_BY_API, currentText())
      } else {
        resolveOnce(options.cancelButtonIndex, currentText())
      }
    }

    dialog.show()
  }

  companion object {
    const val NAME = NativeUnifiedActionSheetSpec.NAME

    private const val DISMISSED_BY_API = -2
  }
}
