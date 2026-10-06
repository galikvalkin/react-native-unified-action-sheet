#import "UnifiedActionSheet.h"

#import <React/RCTInvalidating.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <UnifiedActionSheetSpec/UnifiedActionSheetSpec.h>

#import "react_native_unified_action_sheet-Swift.h"

@interface UnifiedActionSheet () <NativeUnifiedActionSheetSpec, RCTInvalidating>
@end

/// What sheets and prompts share: the buttons, header, colors and appearance.
/// A template because codegen gives each method its own options struct, with
/// the same accessors.
template <typename Options>
static NSMutableDictionary *contentPayload(Options &options)
{
  NSMutableArray *buttons = [NSMutableArray new];
  auto wireButtons = options.buttons();
  for (size_t index = 0; index < wireButtons.size(); ++index) {
    auto button = wireButtons[index];
    NSMutableDictionary *entry = [NSMutableDictionary new];
    entry[@"label"] = button.label();
    entry[@"style"] = button.style();
    entry[@"disabled"] = @(button.disabled().value_or(false));
    entry[@"preferred"] = @(button.preferred().value_or(false));
    entry[@"testID"] = button.testID();
    entry[@"accessibilityLabel"] = button.accessibilityLabel();
    entry[@"accessibilityHint"] = button.accessibilityHint();
    entry[@"requiresText"] = @(button.requiresText().value_or(false));
    [buttons addObject:entry];
  }

  NSMutableDictionary *payload = [NSMutableDictionary new];
  payload[@"buttons"] = buttons;
  payload[@"title"] = options.title();
  payload[@"message"] = options.message();
  if (options.tintColor()) {
    payload[@"tintColor"] = @(*options.tintColor());
  }
  if (options.cancelButtonTintColor()) {
    payload[@"cancelButtonTintColor"] = @(*options.cancelButtonTintColor());
  }
  if (options.destructiveColor()) {
    payload[@"destructiveColor"] = @(*options.destructiveColor());
  }
  payload[@"userInterfaceStyle"] = options.userInterfaceStyle();
  payload[@"testID"] = options.testID();
  if (options.cancelable()) {
    payload[@"cancelable"] = @(*options.cancelable());
  }

  return payload;
}

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
  NSMutableDictionary *payload = contentPayload(options);
  payload[@"presentationStyle"] = options.presentationStyle();
  if (options.detents()) {
    payload[@"detents"] = RCTConvertVecToArray(*options.detents());
  }

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
  NSMutableDictionary *payload = contentPayload(options);
  payload[@"type"] = options.type();
  payload[@"placeholder"] = options.placeholder();
  payload[@"passwordPlaceholder"] = options.passwordPlaceholder();
  payload[@"fieldTestID"] = options.fieldTestID();
  payload[@"passwordFieldTestID"] = options.passwordFieldTestID();
  payload[@"defaultValue"] = options.defaultValue();
  payload[@"keyboardType"] = options.keyboardType();

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
