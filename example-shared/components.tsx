import { Children, forwardRef, useState } from 'react';
import type { ComponentRef, ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from './theme';

export const Section = ({
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
  const palette = usePalette();

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${count} cases`}
      >
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {title}
        </Text>
        <Text style={[styles.sectionMeta, { color: palette.text }]}>
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
export const DemoButton = forwardRef<
  ComponentRef<typeof Pressable>,
  { label: string; onPress: () => void; tone?: 'alt' }
>(({ label, onPress, tone }, ref) => {
  const palette = usePalette();
  const alt = tone === 'alt';

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: alt ? palette.altTintFill : palette.tintFill },
        // Dims while held, like a UIKit button.
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          { color: alt ? palette.altTint : palette.tint },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

DemoButton.displayName = 'DemoButton';

/// The Interop case: a real Modal to open a sheet from.
export const DemoModal = ({
  visible,
  onOpenSheet,
  onClose,
}: {
  visible: boolean;
  onOpenSheet: () => void;
  onClose: () => void;
}) => {
  const palette = usePalette();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>
            A Modal
          </Text>
          <Text style={[styles.modalText, { color: palette.secondaryText }]}>
            Open the sheet from here. It must appear above this modal, and this
            modal must still be open underneath once the sheet closes.
          </Text>
          <DemoButton label="Open action sheet" onPress={onOpenSheet} />
          <DemoButton label="Close modal" onPress={onClose} tone="alt" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
  },
});
