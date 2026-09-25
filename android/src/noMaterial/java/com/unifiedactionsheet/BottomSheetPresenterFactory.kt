package com.unifiedactionsheet

/// Compiled when the app has not set unifiedActionSheet.material=true. There is
/// no bottom sheet without Material, so the module falls back to the centered
/// dialog, and JS warns in development (see getTypedExportedConstants).
internal object BottomSheetPresenterFactory {
  const val isAvailable = false

  fun create(): SheetPresenter? = null
}
