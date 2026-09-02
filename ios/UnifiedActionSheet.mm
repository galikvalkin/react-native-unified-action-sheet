#import "UnifiedActionSheet.h"

#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <UnifiedActionSheetSpec/UnifiedActionSheetSpec.h>

#import "react_native_unified_action_sheet-Swift.h"

@interface UnifiedActionSheet () <NativeUnifiedActionSheetSpec>
@end

@implementation UnifiedActionSheet

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/// Only the keys the iOS presentation understands are forwarded; the
/// Android-only keys in the shared spec are ignored here.
RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (JS::NativeUnifiedActionSheet::SpecShowActionSheetWithOptionsOptions &)options resolve
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
                                       completion:^(NSInteger buttonIndex) {
                                         resolve(@(buttonIndex));
                                       }];
  });
}

RCT_EXPORT_METHOD(showPromptWithOptions
                  : (JS::NativeUnifiedActionSheet::SpecShowPromptWithOptionsOptions &)options resolve
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
  if (options.secureTextEntry()) {
    payload[@"secureTextEntry"] = @(*options.secureTextEntry());
  }

  payload[@"title"] = options.title();
  payload[@"message"] = options.message();
  payload[@"placeholder"] = options.placeholder();
  payload[@"defaultValue"] = options.defaultValue();
  payload[@"keyboardType"] = options.keyboardType();
  payload[@"tintColor"] = options.tintColor();
  payload[@"cancelButtonTintColor"] = options.cancelButtonTintColor();
  payload[@"destructiveColor"] = options.destructiveColor();
  payload[@"userInterfaceStyle"] = options.userInterfaceStyle();

  dispatch_async(dispatch_get_main_queue(), ^{
    [UnifiedActionSheetImpl.shared showPromptWithOptions:payload
                                             completion:^(NSInteger buttonIndex, NSString *text) {
                                               resolve(@{@"buttonIndex" : @(buttonIndex), @"text" : text});
                                             }];
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
