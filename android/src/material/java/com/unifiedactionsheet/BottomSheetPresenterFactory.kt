package com.unifiedactionsheet

/// Compiled only when the app sets unifiedActionSheet.material=true, which also
/// adds the Material dependency. The noMaterial source set defines the same
/// object, so src/main compiles against either.
internal object BottomSheetPresenterFactory {
  const val isAvailable = true

  fun create(): SheetPresenter? = MaterialBottomSheetPresenter
}
