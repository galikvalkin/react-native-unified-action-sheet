import UIKit

/// presentationStyle 'bottom' on iPhone: the rows of an action sheet inside a
/// UISheetPresentationController, which UIAlertController cannot be. Styled
/// like the rest of iOS rather than like the Android sheet: system fonts, the
/// label color (or tintColor), system red for destructive rows.
final class BottomSheetViewController: UIViewController {
  struct Row {
    let index: Int
    let label: String
    let isDestructive: Bool
    let isEnabled: Bool
  }

  private let sheetTitle: String?
  private let message: String?
  private let rows: [Row]
  private let cancelRow: Row?
  private let tintColor: UIColor?
  private let cancelButtonTintColor: UIColor?
  private let destructiveColor: UIColor?
  /// Set by the presenter once it can resolve the sheet.
  var onSelect: ((Int) -> Void)?

  private let scrollView = UIScrollView()
  private let stack = UIStackView()

  init(
    title: String?,
    message: String?,
    rows: [Row],
    cancelRow: Row?,
    tintColor: UIColor?,
    cancelButtonTintColor: UIColor?,
    destructiveColor: UIColor?
  ) {
    self.sheetTitle = title
    self.message = message
    self.rows = rows
    self.cancelRow = cancelRow
    self.tintColor = tintColor
    self.cancelButtonTintColor = cancelButtonTintColor
    self.destructiveColor = destructiveColor
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    // From iOS 26 the system draws the sheet's Liquid Glass background; an
    // opaque color here would cover it.
    if #available(iOS 26.0, *) {
      view.backgroundColor = .clear
    } else {
      view.backgroundColor = .systemBackground
    }

    stack.axis = .vertical
    stack.translatesAutoresizingMaskIntoConstraints = false
    scrollView.translatesAutoresizingMaskIntoConstraints = false
    scrollView.alwaysBounceVertical = false
    scrollView.addSubview(stack)
    view.addSubview(scrollView)

    NSLayoutConstraint.activate([
      scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      stack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
      stack.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
      stack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
      stack.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor),
    ])

    // The last row stays clear of the home indicator once scrolled to it.
    scrollView.contentInsetAdjustmentBehavior = .always

    buildContent()
  }

  /// The height the content wants at the given width, for the fitted detent.
  func fittingHeight(width: CGFloat) -> CGFloat {
    loadViewIfNeeded()

    return stack.systemLayoutSizeFitting(
      CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
      withHorizontalFittingPriority: .required,
      verticalFittingPriority: .fittingSizeLevel
    ).height
  }

  private func buildContent() {
    // Room for the grabber, which the sheet draws over the top of the view.
    stack.addArrangedSubview(spacer(height: 20))

    if let sheetTitle {
      stack.addArrangedSubview(header(sheetTitle, style: .subheadline, weight: .semibold))
    }
    if let message {
      stack.addArrangedSubview(header(message, style: .footnote, weight: .regular))
    }
    if sheetTitle != nil || message != nil {
      stack.addArrangedSubview(spacer(height: 8))
    }

    for row in rows {
      stack.addArrangedSubview(button(for: row, isCancel: false))
    }

    if let cancelRow {
      let separator = UIView()
      separator.backgroundColor = .separator
      separator.heightAnchor.constraint(equalToConstant: 1 / traitCollection.displayScale).isActive = true
      stack.addArrangedSubview(spacer(height: 8))
      stack.addArrangedSubview(separator)
      stack.addArrangedSubview(button(for: cancelRow, isCancel: true))
    }

    stack.addArrangedSubview(spacer(height: 8))
  }

  private func header(_ text: String, style: UIFont.TextStyle, weight: UIFont.Weight) -> UIView {
    let label = UILabel()
    label.text = text
    label.numberOfLines = 0
    label.textAlignment = .center
    label.textColor = .secondaryLabel
    label.adjustsFontForContentSizeCategory = true
    label.font = UIFontMetrics(forTextStyle: style).scaledFont(
      for: .systemFont(ofSize: UIFont.preferredFont(forTextStyle: style).pointSize, weight: weight)
    )
    if weight == .semibold {
      label.accessibilityTraits.insert(.header)
    }

    let container = UIView()
    label.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(label)
    NSLayoutConstraint.activate([
      label.topAnchor.constraint(equalTo: container.topAnchor, constant: 4),
      label.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -4),
      label.leadingAnchor.constraint(equalTo: container.layoutMarginsGuide.leadingAnchor),
      label.trailingAnchor.constraint(equalTo: container.layoutMarginsGuide.trailingAnchor),
    ])
    container.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20)

    return container
  }

  private func button(for row: Row, isCancel: Bool) -> UIButton {
    // Precedence matches the alert: destructive > cancel tint > tint > default.
    let color: UIColor =
      row.isDestructive
      ? (destructiveColor ?? .systemRed)
      : (isCancel ? (cancelButtonTintColor ?? tintColor ?? .label) : (tintColor ?? .label))

    var config = UIButton.Configuration.plain()
    config.title = row.label
    config.baseForegroundColor = color
    config.contentInsets = NSDirectionalEdgeInsets(top: 16, leading: 20, bottom: 16, trailing: 20)
    config.titleAlignment = .leading
    config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
      var attributes = attributes
      attributes.font = UIFont.preferredFont(forTextStyle: .body).withWeight(isCancel ? .semibold : .regular)

      return attributes
    }
    config.background.cornerRadius = 0

    let button = UIButton(configuration: config)
    button.contentHorizontalAlignment = .leading
    button.isEnabled = row.isEnabled
    // A full-width row highlight, as in a list, rather than a dimmed title.
    button.configurationUpdateHandler = { button in
      var updated = button.configuration
      updated?.background.backgroundColor = button.isHighlighted ? .systemFill : .clear
      updated?.baseForegroundColor = button.isEnabled ? color : .tertiaryLabel
      button.configuration = updated
    }
    button.addAction(UIAction { [weak self] _ in self?.onSelect?(row.index) }, for: .touchUpInside)

    return button
  }

  private func spacer(height: CGFloat) -> UIView {
    let view = UIView()
    view.heightAnchor.constraint(equalToConstant: height).isActive = true

    return view
  }
}

private extension UIFont {
  func withWeight(_ weight: UIFont.Weight) -> UIFont {
    let descriptor = fontDescriptor.addingAttributes([
      .traits: [UIFontDescriptor.TraitKey.weight: weight],
    ])

    return UIFont(descriptor: descriptor, size: pointSize)
  }
}
