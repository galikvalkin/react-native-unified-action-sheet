#import "UnifiedActionSheet.h"

#import <React/RCTInvalidating.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <UnifiedActionSheetSpec/UnifiedActionSheetSpec.h>

#import "react_native_unified_action_sheet-Swift.h"

@interface UnifiedActionSheet () <NativeUnifiedActionSheetSpec, RCTInvalidating>
@end

@implementation UnifiedActionSheet

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/// Material is an Android opt-in; iOS presents 'bottom' as the standard action
/// sheet with nothing to enable.
- (facebook::react::ModuleConstants<JS::NativeUnifiedActionSheet::Constants::Builder>)constantsToExport
{
  return [self getConstants];
}

- (facebook::react::ModuleConstants<JS::NativeUnifiedActionSheet::Constants::Builder>)getConstants
{
  return facebook::react::typedConstants<JS::NativeUnifiedActionSheet::Constants::Builder>({
      .isMaterialEnabled = false,
  });
}

/// Only the keys the iOS presentation understands are forwarded; the
/// Android-only keys in the shared spec are ignored here.
RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (JS::NativeUnifiedActionSheet::SpecShowActionSheetWithOptionsOptions &)options onShow
                  : (RCTResponseSenderBlock)onShow resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *payload = [NSMutableDictionary new];

  payload[@"options"] = RCTConvertVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });

  if (options.cancelButtonIndex()) {
    payload[@"cancelButtonIndex"] = @(*options.cancelButtonIndex());
  }
  if (options.destructiveButtonIndices()) {
    payload[@"destructiveButtonIndices"] =
        RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
          return @(element);
        });
  }
  if (options.disabledButtonIndices()) {
    payload[@"disabledButtonIndices"] = RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }

  payload[@"title"] = options.title();
  payload[@"message"] = options.message();
  payload[@"tintColor"] = options.tintColor();
  payload[@"cancelButtonTintColor"] = options.cancelButtonTintColor();
  payload[@"userInterfaceStyle"] = options.userInterfaceStyle();
  payload[@"destructiveColor"] = options.destructiveColor();
  payload[@"presentationStyle"] = options.presentationStyle();

  if (options.preferredButtonIndex()) {
    payload[@"preferredButtonIndex"] = @(*options.preferredButtonIndex());
  }
  if (options.detents()) {
    payload[@"detents"] = RCTConvertVecToArray(*options.detents(), ^id(NSString *element) {
      return element;
    });
  }
  if (options.testIDs()) {
    payload[@"testIDs"] = RCTConvertVecToArray(*options.testIDs(), ^id(NSString *element) {
      return element;
    });
  }
  if (options.accessibilityLabels()) {
    payload[@"accessibilityLabels"] = RCTConvertVecToArray(*options.accessibilityLabels(), ^id(NSString *element) {
      return element;
    });
  }
  if (options.accessibilityHints()) {
    payload[@"accessibilityHints"] = RCTConvertVecToArray(*options.accessibilityHints(), ^id(NSString *element) {
      return element;
    });
  }
  payload[@"testID"] = options.testID();

  // The anchor arrives already measured from the ref on the JS side, so this
  // module never resolves a view and needs no React Native view API.
  auto anchorRect = options.anchorRect();
  if (anchorRect.has_value()) {
    payload[@"anchorRect"] = @{
      @"x" : @(anchorRect->x()),
      @"y" : @(anchorRect->y()),
      @"width" : @(anchorRect->width()),
      @"height" : @(anchorRect->height()),
    };
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared showWithOptions:payload
                                           onShow:^{
                                             onShow(@[]);
                                           }
                                       completion:^(NSInteger buttonIndex) {
                                         resolve(@(buttonIndex));
                                       }];
  });
}

RCT_EXPORT_METHOD(showPromptWithOptions
                  : (JS::NativeUnifiedActionSheet::SpecShowPromptWithOptionsOptions &)options onShow
                  : (RCTResponseSenderBlock)onShow resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *payload = [NSMutableDictionary new];

  payload[@"options"] = RCTConvertVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });

  if (options.cancelButtonIndex()) {
    payload[@"cancelButtonIndex"] = @(*options.cancelButtonIndex());
  }
  if (options.destructiveButtonIndices()) {
    payload[@"destructiveButtonIndices"] =
        RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
          return @(element);
        });
  }
  if (options.disabledButtonIndices()) {
    payload[@"disabledButtonIndices"] = RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }
  if (options.preferredButtonIndex()) {
    payload[@"preferredButtonIndex"] = @(*options.preferredButtonIndex());
  }
  if (options.textRequiredButtonIndices()) {
    payload[@"textRequiredButtonIndices"] =
        RCTConvertVecToArray(*options.textRequiredButtonIndices(), ^id(double element) {
          return @(element);
        });
  }
  if (options.testIDs()) {
    payload[@"testIDs"] = RCTConvertVecToArray(*options.testIDs(), ^id(NSString *element) {
      return element;
    });
  }
  if (options.accessibilityLabels()) {
    payload[@"accessibilityLabels"] = RCTConvertVecToArray(*options.accessibilityLabels(), ^id(NSString *element) {
      return element;
    });
  }
  if (options.accessibilityHints()) {
    payload[@"accessibilityHints"] = RCTConvertVecToArray(*options.accessibilityHints(), ^id(NSString *element) {
      return element;
    });
  }
  payload[@"testID"] = options.testID();

  payload[@"title"] = options.title();
  payload[@"message"] = options.message();
  payload[@"type"] = options.type();
  payload[@"placeholder"] = options.placeholder();
  payload[@"passwordPlaceholder"] = options.passwordPlaceholder();
  payload[@"fieldTestID"] = options.fieldTestID();
  payload[@"passwordFieldTestID"] = options.passwordFieldTestID();
  payload[@"defaultValue"] = options.defaultValue();
  payload[@"keyboardType"] = options.keyboardType();
  payload[@"tintColor"] = options.tintColor();
  payload[@"cancelButtonTintColor"] = options.cancelButtonTintColor();
  payload[@"destructiveColor"] = options.destructiveColor();
  payload[@"userInterfaceStyle"] = options.userInterfaceStyle();

  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared showPromptWithOptions:payload
                                                 onShow:^{
                                                   onShow(@[]);
                                                 }
                                             completion:^(NSInteger buttonIndex, NSString *text, NSString *password) {
                                               resolve(@{
                                                 @"buttonIndex" : @(buttonIndex),
                                                 @"text" : text,
                                                 @"password" : password,
                                               });
                                             }];
  });
}

/// A reload (or any teardown of the JS runtime) replaces the app's root view,
/// but the sheets are presented over it and would otherwise stay on screen.
/// Android closes its dialogs in its own invalidate().
- (void)invalidate
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared invalidate];
  });
}

RCT_EXPORT_METHOD(dismissActionSheet)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared dismiss];
  });
}

RCT_EXPORT_METHOD(dismissAllActionSheets)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared dismissAll];
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeUnifiedActionSheetSpecJSI>(params);
}

@end
