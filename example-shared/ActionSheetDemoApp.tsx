import { Children, forwardRef, useMemo, useRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  dismissActionSheet,
  dismissAllActionSheets,
  showActionSheetWithOptions,
  showPromptWithOptions,
} from 'react-native-unified-action-sheet';

import type { ActionSheetOptionsInterface } from 'react-native-unified-action-sheet';

interface DemoCase {
  label: string;
  options: ActionSheetOptionsInterface;
}

/// Every button carries an onPress, so the demo never matches on an index. The
/// cancel buttons have one too: a backdrop tap resolves the cancel button, so
/// its handler runs even though the row itself was not tapped.
const buildDemoCases = (report: (message: string) => void): DemoCase[] => {
  const press = (label: string) => () => report(`onPress: ${label}`);
  const option = (label: string) => ({ label, onPress: press(label) });

  return [
    {
      label: 'Title, message, disabled row',
      options: {
        title: 'Choose an action',
        message:
          'Buttons are objects: style marks the roles, disabled is independent, and onPress runs without matching on the index.',
        options: [
          option('Share'),
          option('Duplicate'),
          { label: 'Unavailable', disabled: true },
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
      },
    },
    {
      label: 'Destructive + tint colors',
      options: {
        title: 'Delete item?',
        options: [
          { label: 'Delete', style: 'destructive', onPress: press('Delete') },
          {
            label: 'Erase forever',
            style: 'destructive',
            onPress: press('Erase forever'),
          },
          option('Archive'),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        tintColor: '#6200EE',
        cancelButtonTintColor: '#018786',
      },
    },
    {
      label: 'No cancel button',
      options: {
        title: 'Pick one',
        options: [option('Alpha'), option('Beta'), option('Gamma')],
      },
    },
    {
      label: 'Many options (scrolls)',
      options: {
        title: 'Long list',
        options: [
          ...Array.from({ length: 12 }, (_, i) => option(`Option ${i + 1}`)),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
      },
    },
    {
      label: 'Centered, custom destructive, centered labels',
      options: {
        title: 'Centered presentation',
        message:
          'A UIAlertController alert on iOS, a centered dialog on Android. Long list, destructiveColor instead of system red, and buttonTextAlignment: center.',
        options: [
          ...Array.from({ length: 10 }, (_, i) => option(`Option ${i + 1}`)),
          {
            label: 'Remove forever',
            style: 'destructive',
            onPress: press('Remove forever'),
          },
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        destructiveColor: '#FF6D00',
        presentationStyle: 'centered',
        buttonTextAlignment: 'center',
      },
    },
  ];
};

const Section = ({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = Children.count(children);

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${count} cases`}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionMeta}>
          {expanded ? '\u25be' : `${count}  \u25b8`}
        </Text>
      </Pressable>
      {/* Unmounted rather than hidden while collapsed. The anchored case
          measures its own button's ref, and a ref to an off-screen view would
          report a zero rect rather than simply being unavailable. */}
      {expanded ? children : null}
    </View>
  );
};

/// forwardRef, because the anchored case measures this button's own ref.
const DemoButton = forwardRef<
  ComponentRef<typeof Pressable>,
  { label: string; onPress: () => void; tone?: 'alt' }
>(({ label, onPress, tone }, ref) => (
  <Pressable
    ref={ref}
    style={[styles.button, tone === 'alt' && styles.altButton]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
));

DemoButton.displayName = 'DemoButton';

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export default function ActionSheetDemoApp() {
  const [lastResult, setLastResult] = useState<string>('none yet');
  const [isModalVisible, setModalVisible] = useState(false);
  const anchorRef = useRef<ComponentRef<typeof Pressable> | null>(null);

  const demoCases = useMemo(() => buildDemoCases(setLastResult), []);

  /// A button's own onPress reports what ran, so this only has to cover the
  /// outcomes that press no button: a programmatic dismiss, and -1 when the
  /// sheet had no cancel button to resolve.
  const show = async (demo: DemoCase) => {
    const buttonIndex = await showActionSheetWithOptions(demo.options);

    if (buttonIndex == null || buttonIndex < 0) {
      setLastResult(`${demo.label} → no selection`);
    }
  };

  const showTwice = () => {
    const first = demoCases[0]!;
    const second = demoCases[1]!;
    show(first);
    // Rapid double-open: the second sheet must dismiss the first one and the
    // first promise must still resolve exactly once (with its cancel index).
    setTimeout(() => show(second), 400);
  };

  const showTwoAndDismissAll = async () => {
    // Awaits both sheets so the result line reports what actually resolved,
    // instead of being overwritten by their promises settling afterwards.
    const first = showActionSheetWithOptions(demoCases[0]!.options);
    await delay(400);
    const second = showActionSheetWithOptions(demoCases[1]!.options);

    await delay(1400);
    dismissAllActionSheets();

    const results = await Promise.all([first, second]);
    setLastResult(
      results.every((index) => index === undefined)
        ? 'Dismiss all → both closed, no selection'
        : `Dismiss all → unexpected ${results.join(', ')}`
    );
  };

  const showAndDismiss = async () => {
    // dismissActionSheet() closes the top-most sheet, and that resolves with
    // no index rather than a selection.
    setTimeout(() => dismissActionSheet(), 1500);

    const buttonIndex = await showActionSheetWithOptions({
      title: 'Auto-dismissed',
      message: 'Closing in 1.5s via dismissActionSheet().',
      options: [
        {
          label: 'Share',
          onPress: () => setLastResult('Auto-dismiss → Share (beat the timer)'),
        },
        {
          label: 'Duplicate',
          onPress: () =>
            setLastResult('Auto-dismiss → Duplicate (beat the timer)'),
        },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    // Only the programmatic dismiss reaches here; a tapped button reported
    // itself through onPress.
    if (buttonIndex === undefined) {
      setLastResult('Auto-dismiss → resolved with no selection');
    }
  };

  const showAnchored = async () => {
    // A menu-style popup attached to this button. The ref is measured by the
    // library; without a measurable anchor it falls back to a centered dialog.
    const buttonIndex = await showActionSheetWithOptions({
      title: 'Anchored presentation',
      options: [
        { label: 'Share', onPress: () => setLastResult('Anchored → Share') },
        {
          label: 'Duplicate',
          onPress: () => setLastResult('Anchored → Duplicate'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => setLastResult('Anchored → Cancel'),
        },
      ],
      presentationStyle: 'anchored',
      anchor: anchorRef,
      anchorAlignment: 'center',
    });
    if (buttonIndex == null || buttonIndex < 0) {
      setLastResult('Anchored → no selection');
    }
  };

  const showPrompt = async () => {
    // The gap this fills: React Native's own Alert.prompt is iOS-only and does
    // nothing at all on Android.
    const result = await showPromptWithOptions({
      title: 'Rename item',
      message: 'Type a new name.',
      placeholder: 'New name',
      defaultValue: 'Untitled',
      options: [
        {
          label: 'Save',
          onPress: (text) => setLastResult(`Prompt → saved “${text}”`),
        },
        {
          label: 'Delete',
          style: 'destructive',
          onPress: () => setLastResult('Prompt → Delete'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: (text) =>
            setLastResult(`Prompt → cancelled, draft was “${text}”`),
        },
      ],
    });

    if (result === undefined) setLastResult('Prompt → dismissed from code');
  };

  const showSecurePrompt = async () => {
    const result = await showPromptWithOptions({
      title: 'Enter passcode',
      placeholder: 'Passcode',
      secureTextEntry: true,
      keyboardType: 'numeric',
      options: [
        {
          label: 'Unlock',
          onPress: (text) =>
            setLastResult(`Secure prompt → ${text.length} digits entered`),
        },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    if (result === undefined) setLastResult('Secure prompt → dismissed');
  };

  const showFromModal = async () => {
    // react-native-modal renders in its own window, above the activity. The
    // sheet is a dialog owned by the activity, so this is where a z-order bug
    // would show up: the sheet must appear ON TOP of the still-open modal,
    // not behind it.
    const buttonIndex = await showActionSheetWithOptions({
      title: 'Opened from inside a modal',
      message: 'This sheet must render above the modal, which stays open.',
      options: [
        {
          label: 'Share',
          onPress: () => setLastResult('Sheet inside modal → Share'),
        },
        {
          label: 'Duplicate',
          onPress: () => setLastResult('Sheet inside modal → Duplicate'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => setLastResult('Sheet inside modal → Cancel'),
        },
      ],
    });
    if (buttonIndex == null || buttonIndex < 0) {
      setLastResult('Sheet inside modal → no selection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Outside the ScrollView so the result of whatever you just tapped
          stays visible instead of scrolling away with the buttons. */}
      <View style={styles.header}>
        <Text style={styles.heading}>Unified Action Sheet</Text>
        <Text style={styles.result} numberOfLines={2}>
          {lastResult}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Sheets" defaultExpanded>
          {demoCases.map((demo) => (
            <DemoButton
              key={demo.label}
              label={demo.label}
              onPress={() => show(demo)}
            />
          ))}
        </Section>

        <Section title="Prompts">
          <DemoButton
            label="Prompt with a text field"
            onPress={showPrompt}
            tone="alt"
          />
          <DemoButton
            label="Secure numeric prompt"
            onPress={showSecurePrompt}
            tone="alt"
          />
        </Section>

        <Section title="Anchoring">
          <DemoButton
            ref={anchorRef}
            label="Anchored to this button"
            onPress={showAnchored}
            tone="alt"
          />
        </Section>

        <Section title="Stacking and dismissal">
          <DemoButton
            label="Rapid double-open"
            onPress={showTwice}
            tone="alt"
          />
          <DemoButton
            label="Open two, then dismiss all"
            onPress={showTwoAndDismissAll}
            tone="alt"
          />
          <DemoButton
            label="Open then dismiss programmatically"
            onPress={showAndDismiss}
            tone="alt"
          />
        </Section>

        <Section title="Interop">
          <DemoButton
            label="Open a react-native-modal"
            onPress={() => setModalVisible(true)}
            tone="alt"
          />
        </Section>
      </ScrollView>
      <Modal
        useNativeDriver
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>A react-native-modal</Text>
          <Text style={styles.modalText}>
            Open the sheet from here. It must appear above this modal, and this
            modal must still be open underneath once the sheet closes.
          </Text>
          <Pressable style={styles.button} onPress={showFromModal}>
            <Text style={styles.buttonText}>Open action sheet</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.altButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Close modal</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000022',
    gap: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  result: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.45,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.45,
  },
  button: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  altButton: {
    backgroundColor: '#018786',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  modalText: {
    fontSize: 14,
    color: '#444444',
  },
});
