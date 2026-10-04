import Foundation
import UIKit

@objc(UnifiedActionSheetImpl)
public class UnifiedActionSheetImpl: NSObject, UIPopoverPresentationControllerDelegate,
  UISheetPresentationControllerDelegate
{
  @objc public static let shared = UnifiedActionSheetImpl()

  private static let dismissedByApi = -2

  private var presentations: [Presentation] = []

  @objc public func show(
    options: NSDictionary,
    onShow: @escaping () -> Void,
    completion: @escaping (Int) -> Void
  ) {
    let labels = options["options"] as? [String] ?? []
    let cancelButtonIndex = (options["cancelButtonIndex"] as? NSNumber)?.intValue ?? -1
    let destructiveIndices = Set(
      (options["destructiveButtonIndices"] as? [NSNumber])?.map { $0.intValue } ?? []
    )
    let disabledIndices = Set(
      (options["disabledButtonIndices"] as? [NSNumber])?.map { $0.intValue } ?? []
    )
    let tintColor = Self.color(options["tintColor"])
    let cancelButtonTintColor = Self.color(options["cancelButtonTintColor"])
    let destructiveColor = Self.color(options["destructiveColor"])
    let preferredIndex = (options["preferredButtonIndex"] as? NSNumber)?.intValue
    let testIDs = options["testIDs"] as? [String] ?? []
    let accessibilityLabels = options["accessibilityLabels"] as? [String] ?? []
    let accessibilityHints = options["accessibilityHints"] as? [String] ?? []
    let sheetTestID = Self.text(options["testID"])

    guard let parent = Self.presentedViewController() else {
      // Never shown, so onShow is never called.
      completion(cancelButtonIndex)

      return
    }

    // 'bottom' is a real sheet on iPhone. iPad keeps the action sheet below,
    // which presents as a popover there: a sheet on iPad is a centered form
    // sheet, not attached to the bottom at all.
    if options["presentationStyle"] as? String == "bottom",
      UIDevice.current.userInterfaceIdiom != .pad
    {
      presentBottomSheet(
        on: parent,
        options: options,
        labels: labels,
        cancelButtonIndex: cancelButtonIndex,
        destructiveIndices: destructiveIndices,
        disabledIndices: disabledIndices,
        preferredIndex: preferredIndex,
        testIDs: testIDs,
        accessibilityLabels: accessibilityLabels,
        accessibilityHints: accessibilityHints,
        sheetTestID: sheetTestID,
        tintColor: tintColor,
        cancelButtonTintColor: cancelButtonTintColor,
        destructiveColor: destructiveColor,
        onShow: onShow,
        completion: completion
      )

      return
    }

    // 'centered' maps to UIKit's centered alert style; anything else (including
    // absent, and 'anchored') stays .actionSheet, the iOS default — presented
    // from the bottom on iPhone and as a popover on iPad.
    let isCentered = options["presentationStyle"] as? String == "centered"

    let alert = UIAlertController(
      title: Self.text(options["title"]),
      message: Self.text(options["message"]),
      preferredStyle: isCentered ? .alert : .actionSheet
    )

    let presentation = Presentation(
      controller: alert,
      cancelButtonIndex: cancelButtonIndex,
      onShow: onShow,
      completion: { index, _, _ in completion(index) }
    )

    for (index, label) in labels.enumerated() {
      let isCancel = index == cancelButtonIndex
      let style: UIAlertAction.Style =
        destructiveIndices.contains(index) ? .destructive : (isCancel ? .cancel : .default)

      // Weak: the presentation holds the alert, which holds this handler.
      let action = UIAlertAction(title: label, style: style) { [weak self, weak presentation] _ in
        guard let presentation else { return }

        self?.finish(presentation, index: index)
      }
      action.accessibilityIdentifier = Self.entry(testIDs, index)

      // Precedence matches Android: destructive > cancel tint > tint > default.
      // disabledButtonTintColor is deliberately absent: UIKit owns the
      // appearance of a disabled action and discards titleTextColor for it.
      let color: UIColor? =
        style == .destructive
        ? destructiveColor
        : (isCancel ? (cancelButtonTintColor ?? tintColor) : tintColor)

      action.isEnabled = !disabledIndices.contains(index)

      if let color {
        // UIKit exposes no public API for per-action title colors.
        action.setValue(color, forKey: "titleTextColor")
      }
      alert.addAction(action)
    }

    // UIKit only honors a preferred action in the alert style; the action
    // sheet already bolds its cancel button.
    if isCentered, let preferredIndex, alert.actions.indices.contains(preferredIndex) {
      alert.preferredAction = alert.actions[preferredIndex]
    }

    alert.view.tintColor = tintColor
    // UIAlertAction has no public accessibilityLabel or hint, so per-button
    // labels and hints apply to the bottom sheet only; the sheet's own id does.
    alert.view.accessibilityIdentifier = sheetTestID

    switch options["userInterfaceStyle"] as? String {
    case "dark": alert.overrideUserInterfaceStyle = .dark
    case "light": alert.overrideUserInterfaceStyle = .light
    default: alert.overrideUserInterfaceStyle = .unspecified
    }

    if let popover = alert.popoverPresentationController {
      let anchorRect = Self.rect(options["anchorRect"])

      if anchorRect == nil {
        popover.permittedArrowDirections = []
      }

      // Only iPad, where an unanchored action sheet raises an exception. Setting
      // these on iPhone makes iOS 26 present the sheet as a popover, which is
      // narrower and silently drops the cancel action.
      if UIDevice.current.userInterfaceIdiom == .pad, let source = parent.view {
        popover.sourceView = source
        // Measured from the ref in JS, already in window points — iOS needs
        // neither the density conversion nor the screen offset Android does.
        popover.sourceRect = anchorRect.map { source.convert($0, from: nil) }
          ?? source.bounds
      }
    }

    // An iPad popover tapped away runs no action handler — UIKit drops the
    // cancel action in popovers — so without this the promise would never
    // resolve. The delegate goes on the popover controller: UIKit raises if you
    // set one on a UIAlertController's own presentationController.
    alert.popoverPresentationController?.delegate = self

    present(presentation, on: parent)
  }

  /// React Native's Alert.prompt is iOS-only; this is the shared half of the
  /// unified prompt. Always .alert -- UIKit has no text field in an action
  /// sheet, and a prompt is inherently a centered, modal question.
  @objc public func showPrompt(
    options: NSDictionary,
    onShow: @escaping () -> Void,
    completion: @escaping (Int, String, String) -> Void
  ) {
    let labels = options["options"] as? [String] ?? []
    let cancelButtonIndex = (options["cancelButtonIndex"] as? NSNumber)?.intValue ?? -1
    let destructiveIndices = Set(
      (options["destructiveButtonIndices"] as? [NSNumber])?.map { $0.intValue } ?? []
    )
    let disabledIndices = Set(
      (options["disabledButtonIndices"] as? [NSNumber])?.map { $0.intValue } ?? []
    )
    let tintColor = Self.color(options["tintColor"])
    let cancelButtonTintColor = Self.color(options["cancelButtonTintColor"])
    let destructiveColor = Self.color(options["destructiveColor"])
    let preferredIndex = (options["preferredButtonIndex"] as? NSNumber)?.intValue
    let textRequiredIndices = Set(
      (options["textRequiredButtonIndices"] as? [NSNumber])?.map { $0.intValue } ?? []
    )
    let type = options["type"] as? String ?? "plain-text"
    let testIDs = options["testIDs"] as? [String] ?? []

    guard let parent = Self.presentedViewController() else {
      // Never shown, so onShow is never called.
      completion(cancelButtonIndex, "", "")

      return
    }

    let alert = UIAlertController(
      title: Self.text(options["title"]),
      message: Self.text(options["message"]),
      preferredStyle: .alert
    )

    alert.addTextField { field in
      field.placeholder = Self.text(options["placeholder"])
      field.text = Self.text(options["defaultValue"])
      field.isSecureTextEntry = type == "secure-text"
      field.keyboardType = Self.keyboardType(options["keyboardType"])
      field.accessibilityIdentifier = Self.text(options["fieldTestID"])
      if type == "login-password" {
        field.textContentType = .username
      }
    }

    // As in React Native's Alert.prompt: a secure field below the login one.
    // The content types let Password AutoFill offer saved credentials.
    if type == "login-password" {
      alert.addTextField { field in
        field.placeholder = Self.text(options["passwordPlaceholder"])
        field.isSecureTextEntry = true
        field.textContentType = .password
        field.accessibilityIdentifier = Self.text(options["passwordFieldTestID"])
      }
    }

    let presentation = Presentation(
      controller: alert,
      cancelButtonIndex: cancelButtonIndex,
      // Weak, or the presentation would retain the controller it is stored on.
      currentValues: { [weak alert] in
        let fields = alert?.textFields ?? []

        return (
          fields.first?.text ?? "",
          fields.count > 1 ? (fields[1].text ?? "") : ""
        )
      },
      onShow: onShow,
      completion: completion
    )

    for (index, label) in labels.enumerated() {
      let isCancel = index == cancelButtonIndex
      let style: UIAlertAction.Style =
        destructiveIndices.contains(index) ? .destructive : (isCancel ? .cancel : .default)

      // Weak: the presentation holds the alert, which holds this handler.
      let action = UIAlertAction(title: label, style: style) { [weak self, weak presentation] _ in
        guard let presentation else { return }

        self?.finish(presentation, index: index)
      }
      action.accessibilityIdentifier = Self.entry(testIDs, index)

      let color: UIColor? =
        style == .destructive
        ? destructiveColor
        : (isCancel ? (cancelButtonTintColor ?? tintColor) : tintColor)

      action.isEnabled = !disabledIndices.contains(index)

      if let color {
        action.setValue(color, forKey: "titleTextColor")
      }
      alert.addAction(action)
    }

    alert.view.accessibilityIdentifier = Self.text(options["testID"])

    // Bold, and triggered by the keyboard's return key.
    if let preferredIndex, alert.actions.indices.contains(preferredIndex) {
      alert.preferredAction = alert.actions[preferredIndex]
    }

    // requiresText: those buttons stay disabled while any field is empty.
    if !textRequiredIndices.isEmpty {
      let update: () -> Void = { [weak alert] in
        guard let alert else { return }

        let filled = (alert.textFields ?? []).allSatisfy { !($0.text ?? "").isEmpty }
        for index in textRequiredIndices where alert.actions.indices.contains(index) {
          alert.actions[index].isEnabled = filled && !disabledIndices.contains(index)
        }
      }

      alert.textFields?.forEach { field in
        field.addAction(UIAction { _ in update() }, for: .editingChanged)
      }
      // A defaultValue may already satisfy it.
      update()
    }

    alert.view.tintColor = tintColor

    switch options["userInterfaceStyle"] as? String {
    case "dark": alert.overrideUserInterfaceStyle = .dark
    case "light": alert.overrideUserInterfaceStyle = .light
    default: alert.overrideUserInterfaceStyle = .unspecified
    }

    present(presentation, on: parent)
  }

  private func presentBottomSheet(
    on parent: UIViewController,
    options: NSDictionary,
    labels: [String],
    cancelButtonIndex: Int,
    destructiveIndices: Set<Int>,
    disabledIndices: Set<Int>,
    preferredIndex: Int?,
    testIDs: [String],
    accessibilityLabels: [String],
    accessibilityHints: [String],
    sheetTestID: String?,
    tintColor: UIColor?,
    cancelButtonTintColor: UIColor?,
    destructiveColor: UIColor?,
    onShow: @escaping () -> Void,
    completion: @escaping (Int) -> Void
  ) {
    let rows = labels.enumerated().map { index, label in
      BottomSheetViewController.Row(
        index: index,
        label: label,
        isDestructive: destructiveIndices.contains(index),
        isEnabled: !disabledIndices.contains(index),
        isPreferred: index == preferredIndex,
        testID: Self.entry(testIDs, index),
        accessibilityLabel: Self.entry(accessibilityLabels, index),
        accessibilityHint: Self.entry(accessibilityHints, index)
      )
    }

    let sheet = BottomSheetViewController(
      title: Self.text(options["title"]),
      message: Self.text(options["message"]),
      rows: rows.filter { $0.index != cancelButtonIndex },
      cancelRow: rows.first { $0.index == cancelButtonIndex },
      tintColor: tintColor,
      cancelButtonTintColor: cancelButtonTintColor,
      destructiveColor: destructiveColor
    )

    let presentation = Presentation(
      controller: sheet,
      cancelButtonIndex: cancelButtonIndex,
      onShow: onShow,
      completion: { index, _, _ in completion(index) }
    )

    // Weak: the presentation holds the sheet, which holds this closure.
    sheet.onSelect = { [weak self, weak presentation] index in
      guard let presentation else { return }

      // Unlike an alert action, a row does not dismiss the sheet itself.
      // Resolve once it is gone, as an alert does.
      presentation.controller.dismiss(animated: true) {
        self?.finish(presentation, index: index)
      }
    }

    switch options["userInterfaceStyle"] as? String {
    case "dark": sheet.overrideUserInterfaceStyle = .dark
    case "light": sheet.overrideUserInterfaceStyle = .light
    default: sheet.overrideUserInterfaceStyle = .unspecified
    }
    sheet.view.tintColor = tintColor
    sheet.view.accessibilityIdentifier = sheetTestID

    if let controller = sheet.sheetPresentationController {
      controller.prefersGrabberVisible = true
      controller.prefersEdgeAttachedInCompactHeight = true
      // Swipe down resolves through presentationControllerDidDismiss.
      controller.delegate = self

      let bounds = parent.view.window?.bounds ?? parent.view.bounds
      let fitting = sheet.fittingHeight(width: bounds.width)
      let requested = options["detents"] as? [String] ?? []

      if !requested.isEmpty {
        // The caller's heights; it opens at the first. Duplicates collapse,
        // e.g. 'auto' and 'medium' on iOS 15, where 'auto' is half height.
        var detents: [UISheetPresentationController.Detent] = []
        var identifiers: [UISheetPresentationController.Detent.Identifier] = []
        for name in requested {
          let (detent, identifier) = Self.detent(named: name, fitting: fitting)
          guard !identifiers.contains(identifier) else { continue }

          detents.append(detent)
          identifiers.append(identifier)
        }
        controller.detents = detents
        controller.selectedDetentIdentifier = identifiers.first
      } else if #available(iOS 16.0, *), fitting <= bounds.height / 2 {
        // A short list opens at its own height; a long one opens at half
        // height and drags up to expand, like the Android sheet. Fitting the
        // content needs a custom detent, iOS 16+; iOS 15 opens at half height.
        controller.detents = [Self.detent(named: "auto", fitting: fitting).0]
      } else {
        controller.detents = [.medium(), .large()]
      }
    }

    present(presentation, on: parent)
  }

  /// Interactive dismissal of a sheet: a swipe down or a tap on the dimmed
  /// area. It resolves the cancel index, or -1 without one, like Android. A
  /// programmatic dismiss() does not call this.
  public func presentationControllerDidDismiss(
    _ presentationController: UIPresentationController
  ) {
    guard
      let presentation = presentations.first(where: {
        $0.controller === presentationController.presentedViewController
      })
    else { return }

    finish(presentation, index: presentation.cancelButtonIndex)
  }

  @objc public func dismissAll() {
    guard let bottom = presentations.first else { return }

    let all = presentations

    // Sheets stack by presenting on top of each other, and dismiss() tears down
    // what the receiver *presented*, not the receiver itself. Dismissing each
    // controller in turn therefore closes only the top one. Asking the lowest
    // sheet's presenter to dismiss removes that sheet and everything above it.
    guard let presenter = bottom.controller.presentingViewController else {
      all.forEach { finish($0, index: Self.dismissedByApi) }

      return
    }

    presenter.dismiss(animated: true) { [weak self] in
      all.forEach { self?.finish($0, index: Self.dismissedByApi) }
    }
  }

  /// The JS runtime is going away: close every sheet, prompt and alert, but
  /// resolve none of them. Their promises belong to the runtime being torn
  /// down, and the list is shared, so stale entries must not outlive it.
  @objc public func invalidate() {
    let all = presentations
    presentations.removeAll()
    all.forEach { $0.discard() }

    // As in dismissAll(): the lowest sheet's presenter dismisses it and
    // everything stacked above it.
    all.first { $0.controller.presentingViewController != nil }?
      .controller.presentingViewController?
      .dismiss(animated: false)
  }

  @objc public func dismiss() {
    guard let presentation = presentations.last else { return }

    // Still waiting for a transition to end, so not on screen: nothing to
    // dismiss, and UIKit would not call the completion below.
    guard presentation.controller.presentingViewController != nil else {
      return finish(presentation, index: Self.dismissedByApi)
    }

    presentation.controller.dismiss(animated: true) { [weak self] in
      self?.finish(presentation, index: Self.dismissedByApi)
    }
  }

  /// Interactive dismissal only — a programmatic dismiss() does not call this,
  /// so the -2 sentinel it resolves with is never overwritten here.
  public func popoverPresentationControllerDidDismissPopover(
    _ popoverPresentationController: UIPopoverPresentationController
  ) {
    let alert = popoverPresentationController.presentedViewController
    guard let presentation = presentations.first(where: { $0.controller === alert })
    else { return }

    finish(presentation, index: presentation.cancelButtonIndex)
  }

  /// Presents once parent can take it. UIKit refuses to present while a
  /// presentation or dismissal is running (a React Native Modal closing, say),
  /// and only logs when it does, which would leave the promise pending. So wait
  /// for that transition to end, and resolve as cancelled if UIKit still
  /// refuses. The presentation is registered first, so dismissActionSheet()
  /// and a reload can still reach it while it waits.
  private func present(_ presentation: Presentation, on parent: UIViewController) {
    if !presentations.contains(where: { $0 === presentation }) {
      presentations.append(presentation)
    }

    let busy = parent.presentedViewController ?? parent
    if let coordinator = busy.transitionCoordinator {
      coordinator.animate(alongsideTransition: nil) { [weak self, weak presentation, weak parent] _ in
        // After the transition's own completion has run.
        DispatchQueue.main.async {
          guard let self, let presentation, let parent,
            self.presentations.contains(where: { $0 === presentation })
          else { return }

          self.present(presentation, on: parent)
        }
      }

      return
    }

    let controller = presentation.controller
    parent.present(controller, animated: true) { [weak presentation] in presentation?.shown() }

    guard controller.presentingViewController == nil else { return }

    // Refused. Never shown, so onShow is never called.
    finish(presentation, index: presentation.cancelButtonIndex)
  }

  /// Resolves a presentation once and drops it from the stack. A sheet dismissed
  /// without a selection resolves with the cancel index, matching Android.
  private func finish(_ presentation: Presentation, index: Int) {
    presentations.removeAll { $0 === presentation }
    presentation.resolve(index)
  }

  /// A button's entry in one of the per-button arrays (testIDs,
  /// accessibilityLabels, accessibilityHints), or nil for none: the wire
  /// sends '' for a gap.
  private static func entry(_ values: [String], _ index: Int) -> String? {
    guard values.indices.contains(index), !values[index].isEmpty else { return nil }

    return values[index]
  }

  /// 'auto' fits the content (iOS 16+; half height on iOS 15), 'medium' is
  /// half height, 'large' is full height.
  private static func detent(
    named name: String,
    fitting: CGFloat
  ) -> (UISheetPresentationController.Detent, UISheetPresentationController.Detent.Identifier) {
    switch name {
    case "large":
      return (.large(), .large)
    case "auto":
      if #available(iOS 16.0, *) {
        let identifier = UISheetPresentationController.Detent.Identifier("unifiedActionSheet.content")

        return (.custom(identifier: identifier) { min(fitting, $0.maximumDetentValue) }, identifier)
      }
      return (.medium(), .medium)
    default:
      return (.medium(), .medium)
    }
  }

  private final class Presentation {
    /// A UIAlertController, or the bottom sheet on iPhone.
    let controller: UIViewController
    let cancelButtonIndex: Int
    /// Read at resolve time, not at creation: the values that matter are
    /// whatever is in the fields when the prompt closes. Sheets pass constants.
    private let currentValues: () -> (String, String)
    private var completion: ((Int, String, String) -> Void)?
    /// Called once, when the presentation animation completes. Cleared on
    /// resolve and discard, so it never fires late or into a reloaded runtime.
    private var onShow: (() -> Void)?

    init(
      controller: UIViewController,
      cancelButtonIndex: Int,
      currentValues: @escaping () -> (String, String) = { ("", "") },
      onShow: @escaping () -> Void,
      completion: @escaping (Int, String, String) -> Void
    ) {
      self.controller = controller
      self.cancelButtonIndex = cancelButtonIndex
      self.currentValues = currentValues
      self.onShow = onShow
      self.completion = completion
    }

    /// The sheet is on screen.
    func shown() {
      let onShow = self.onShow
      self.onShow = nil
      onShow?()
    }

    /// Drops the completion (and a pending onShow) without calling either.
    func discard() {
      completion = nil
      onShow = nil
    }

    func resolve(_ index: Int) {
      onShow = nil
      guard let completion else { return }

      self.completion = nil
      let (text, password) = currentValues()
      completion(index, text, password)
    }
  }

  private static func presentedViewController() -> UIViewController? {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }

    // A controller on its way out is no place to present from: stop at the
    // one it leaves behind. present(_:on:) waits for it to finish leaving.
    var controller = window?.rootViewController
    while let presented = controller?.presentedViewController, !presented.isBeingDismissed {
      controller = presented
    }

    return controller
  }

  private static func rect(_ value: Any?) -> CGRect? {
    guard let map = value as? NSDictionary,
      let x = (map["x"] as? NSNumber)?.doubleValue,
      let y = (map["y"] as? NSNumber)?.doubleValue,
      let width = (map["width"] as? NSNumber)?.doubleValue,
      let height = (map["height"] as? NSNumber)?.doubleValue
    else { return nil }

    return CGRect(x: x, y: y, width: width, height: height)
  }

  /// Mirrors the subset of React Native's keyboardType values that map cleanly
  /// onto both platforms; anything else falls back to the default keyboard.
  private static func keyboardType(_ value: Any?) -> UIKeyboardType {
    switch value as? String {
    case "email-address": return .emailAddress
    case "numeric": return .numberPad
    case "phone-pad": return .phonePad
    case "url": return .URL
    default: return .default
    }
  }

  private static func text(_ value: Any?) -> String? {
    guard let string = value as? String, !string.isEmpty else { return nil }

    return string
  }

  /// Colors cross the bridge as React Native's processColor output: an ARGB
  /// number, unsigned on iOS. Truncated to 32 bits, so a signed one works too.
  private static func color(_ value: Any?) -> UIColor? {
    guard let number = value as? NSNumber else { return nil }

    let argb = UInt32(truncatingIfNeeded: number.int64Value)
    let alpha = CGFloat((argb >> 24) & 0xFF) / 255
    let red = CGFloat((argb >> 16) & 0xFF) / 255
    let green = CGFloat((argb >> 8) & 0xFF) / 255
    let blue = CGFloat(argb & 0xFF) / 255

    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}
