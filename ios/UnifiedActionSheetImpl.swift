import Foundation
import UIKit

@objc(UnifiedActionSheetImpl)
public class UnifiedActionSheetImpl: NSObject, UIPopoverPresentationControllerDelegate {
  @objc public static let shared = UnifiedActionSheetImpl()

  private static let dismissedByApi = -2

  private var presentations: [Presentation] = []

  @objc public func show(
    options: NSDictionary,
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

    guard let parent = Self.presentedViewController() else {
      completion(cancelButtonIndex)

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
      completion: { index, _ in completion(index) }
    )

    for (index, label) in labels.enumerated() {
      let isCancel = index == cancelButtonIndex
      let style: UIAlertAction.Style =
        destructiveIndices.contains(index) ? .destructive : (isCancel ? .cancel : .default)

      let action = UIAlertAction(title: label, style: style) { [weak self] _ in
        self?.finish(presentation, index: index)
      }

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

    alert.view.tintColor = tintColor

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

    presentations.append(presentation)
    parent.present(alert, animated: true)
  }

  /// React Native's Alert.prompt is iOS-only; this is the shared half of the
  /// unified prompt. Always .alert -- UIKit has no text field in an action
  /// sheet, and a prompt is inherently a centered, modal question.
  @objc public func showPrompt(
    options: NSDictionary,
    completion: @escaping (Int, String) -> Void
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

    guard let parent = Self.presentedViewController() else {
      completion(cancelButtonIndex, "")

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
      field.isSecureTextEntry = (options["secureTextEntry"] as? NSNumber)?.boolValue ?? false
      field.keyboardType = Self.keyboardType(options["keyboardType"])
    }

    let presentation = Presentation(
      controller: alert,
      cancelButtonIndex: cancelButtonIndex,
      // Weak, or the presentation would retain the controller it is stored on.
      currentText: { [weak alert] in alert?.textFields?.first?.text ?? "" },
      completion: completion
    )

    for (index, label) in labels.enumerated() {
      let isCancel = index == cancelButtonIndex
      let style: UIAlertAction.Style =
        destructiveIndices.contains(index) ? .destructive : (isCancel ? .cancel : .default)

      let action = UIAlertAction(title: label, style: style) { [weak self] _ in
        self?.finish(presentation, index: index)
      }

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

    alert.view.tintColor = tintColor

    switch options["userInterfaceStyle"] as? String {
    case "dark": alert.overrideUserInterfaceStyle = .dark
    case "light": alert.overrideUserInterfaceStyle = .light
    default: alert.overrideUserInterfaceStyle = .unspecified
    }

    presentations.append(presentation)
    parent.present(alert, animated: true)
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

  @objc public func dismiss() {
    guard let presentation = presentations.last else { return }

    presentation.controller.dismiss(animated: true) { [weak self] in
      self?.finish(presentation, index: Self.dismissedByApi)
    }
  }

  /// Interactive dismissal only — a programmatic dismiss() does not call this,
  /// so the -2 sentinel it resolves with is never overwritten here.
  public func popoverPresentationControllerDidDismissPopover(
    _ popoverPresentationController: UIPopoverPresentationController
  ) {
    guard
      let alert = popoverPresentationController.presentedViewController
        as? UIAlertController,
      let presentation = presentations.first(where: { $0.controller === alert })
    else { return }

    finish(presentation, index: presentation.cancelButtonIndex)
  }

  /// Resolves a presentation once and drops it from the stack. A sheet dismissed
  /// without a selection resolves with the cancel index, matching Android.
  private func finish(_ presentation: Presentation, index: Int) {
    presentations.removeAll { $0 === presentation }
    presentation.resolve(index)
  }

  private final class Presentation {
    let controller: UIAlertController
    let cancelButtonIndex: Int
    /// Read at resolve time, not at creation: the value that matters is
    /// whatever is in the field when the prompt closes. Sheets pass a constant.
    private let currentText: () -> String
    private var completion: ((Int, String) -> Void)?

    init(
      controller: UIAlertController,
      cancelButtonIndex: Int,
      currentText: @escaping () -> String = { "" },
      completion: @escaping (Int, String) -> Void
    ) {
      self.controller = controller
      self.cancelButtonIndex = cancelButtonIndex
      self.currentText = currentText
      self.completion = completion
    }

    func resolve(_ index: Int) {
      guard let completion else { return }

      self.completion = nil
      completion(index, currentText())
    }
  }

  private static func presentedViewController() -> UIViewController? {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }

    var controller = window?.rootViewController
    while let presented = controller?.presentedViewController {
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

  /// Colors cross the bridge as hex strings, matching the Android side.
  private static func color(_ value: Any?) -> UIColor? {
    guard var hex = value as? String else { return nil }

    hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hex.hasPrefix("#") { hex.removeFirst() }

    if hex.count == 3 {
      hex = hex.map { "\($0)\($0)" }.joined()
    }

    guard hex.count == 6 || hex.count == 8, let value = UInt64(hex, radix: 16) else {
      return nil
    }

    let hasAlpha = hex.count == 8
    let alpha = hasAlpha ? CGFloat((value >> 24) & 0xFF) / 255 : 1
    let red = CGFloat((value >> 16) & 0xFF) / 255
    let green = CGFloat((value >> 8) & 0xFF) / 255
    let blue = CGFloat(value & 0xFF) / 255

    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}
