import { useMemo, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DemoButton, DemoModal, Section } from './components';
import { buildDemoCases } from './demoCases';
import { createPromptActions } from './promptActions';
import { createSheetActions } from './sheetActions';
import { palettes, usePalette } from './theme';

export default function ActionSheetDemoApp() {
  const [lastResult, setLastResult] = useState<string>('none yet');
  const palette = usePalette();
  const [isModalVisible, setModalVisible] = useState(false);
  const anchorRef = useRef<ComponentRef<typeof Pressable> | null>(null);

  const demoCases = useMemo(() => buildDemoCases(setLastResult), []);
  const sheets = useMemo(
    () => createSheetActions(setLastResult, demoCases, anchorRef),
    [demoCases]
  );
  const prompts = useMemo(() => createPromptActions(setLastResult), []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.background }]}
      >
        <StatusBar
          barStyle={
            palette === palettes.dark ? 'light-content' : 'dark-content'
          }
        />
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <Text style={[styles.heading, { color: palette.text }]}>
            Unified Action Sheet
          </Text>
          <Text
            style={[styles.result, { color: palette.text }]}
            numberOfLines={2}
          >
            {lastResult}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Sheets" defaultExpanded>
            {demoCases.map((demo) => (
              <DemoButton
                key={demo.label}
                label={demo.label}
                onPress={() => sheets.show(demo)}
              />
            ))}
          </Section>

          <Section title="Prompts">
            <DemoButton
              label="Prompt with a text field"
              onPress={prompts.showPrompt}
              tone="alt"
            />
            <DemoButton
              label="Secure numeric prompt"
              onPress={prompts.showSecurePrompt}
              tone="alt"
            />
            <DemoButton
              label="Sign in (login and password)"
              onPress={prompts.showLoginPrompt}
              tone="alt"
            />
          </Section>

          <Section title="Anchoring">
            <DemoButton
              ref={anchorRef}
              label="Anchored to this button"
              onPress={sheets.showAnchored}
              tone="alt"
            />
          </Section>

          <Section title="Stacking and dismissal">
            <DemoButton
              label="Rapid double-open"
              onPress={sheets.showTwice}
              tone="alt"
            />
            <DemoButton
              label="Open two, then dismiss all"
              onPress={sheets.showTwoAndDismissAll}
              tone="alt"
            />
            <DemoButton
              label="Open then dismiss programmatically"
              onPress={sheets.showAndDismiss}
              tone="alt"
            />
          </Section>

          <Section title="Interop">
            <DemoButton
              label="Open a Modal"
              onPress={() => setModalVisible(true)}
              tone="alt"
            />
          </Section>
        </ScrollView>
        <DemoModal
          visible={isModalVisible}
          onOpenSheet={sheets.showFromModal}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
});
