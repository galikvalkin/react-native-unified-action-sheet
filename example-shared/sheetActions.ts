import type { ComponentRef, RefObject } from 'react';
import type { Pressable } from 'react-native';
import {
  dismissActionSheet,
  dismissAllActionSheets,
  showActionSheetWithOptions,
} from 'react-native-unified-action-sheet';

import { toTestID } from './demoCases';
import type { DemoCase } from './demoCases';

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const createSheetActions = (
  report: (message: string) => void,
  demoCases: DemoCase[],
  anchorRef: RefObject<ComponentRef<typeof Pressable> | null>
) => {
  const show = async (demo: DemoCase) => {
    const result = await showActionSheetWithOptions({
      ...demo.options,
      options: demo.options.options.map((button) => ({
        ...button,
        testID: button.testID ?? toTestID(button.label),
      })),
      onShow: () => report(`${demo.label} → shown`),
      testID: `${toTestID(demo.label)}-sheet`,
    });

    if (result.reason === 'dismissed' || result.buttonIndex < 0) {
      report(`${demo.label} → ${result.reason}, no button`);
    } else if (result.value !== undefined) {
      report(
        `${demo.label} → ${result.reason}, value ${JSON.stringify(result.value)}`
      );
    }
  };

  const showTwice = () => {
    const first = demoCases[0]!;
    const second = demoCases[1]!;
    show(first);
    setTimeout(() => show(second), 400);
  };

  const showTwoAndDismissAll = async () => {
    const first = showActionSheetWithOptions(demoCases[0]!.options);
    await delay(400);
    const second = showActionSheetWithOptions(demoCases[1]!.options);

    await delay(1400);
    dismissAllActionSheets();

    const results = await Promise.all([first, second]);
    report(
      results.every((result) => result.reason === 'dismissed')
        ? 'Dismiss all → both dismissed'
        : `Dismiss all → unexpected ${results.map((r) => r.reason).join(', ')}`
    );
  };

  const showAndDismiss = async () => {
    setTimeout(() => dismissActionSheet(), 1500);

    const result = await showActionSheetWithOptions({
      title: 'Auto-dismissed',
      message: 'Closing in 1.5s via dismissActionSheet().',
      options: [
        {
          label: 'Share',
          onPress: () => report('Auto-dismiss → Share (beat the timer)'),
        },
        {
          label: 'Duplicate',
          onPress: () => report('Auto-dismiss → Duplicate (beat the timer)'),
        },
        { label: 'Cancel', style: 'cancel' },
      ],
    });

    if (result.reason === 'dismissed') {
      report('Auto-dismiss → dismissed');
    }
  };

  const showAnchored = async () => {
    const result = await showActionSheetWithOptions({
      title: 'Anchored presentation',
      options: [
        { label: 'Share', onPress: () => report('Anchored → Share') },
        {
          label: 'Duplicate',
          onPress: () => report('Anchored → Duplicate'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => report('Anchored → Cancel'),
        },
      ],
      presentationStyle: 'anchored',
      anchor: anchorRef,
      anchorAlignment: 'center',
    });
    if (result.reason === 'dismissed' || result.buttonIndex < 0) {
      report(`Anchored → ${result.reason}, no button`);
    }
  };

  const showFromModal = async () => {
    const result = await showActionSheetWithOptions({
      title: 'Opened from inside a modal',
      message: 'This sheet must render above the modal, which stays open.',
      options: [
        {
          label: 'Share',
          onPress: () => report('Sheet inside modal → Share'),
        },
        {
          label: 'Duplicate',
          onPress: () => report('Sheet inside modal → Duplicate'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => report('Sheet inside modal → Cancel'),
        },
      ],
    });
    if (result.reason === 'dismissed' || result.buttonIndex < 0) {
      report(`Sheet inside modal → ${result.reason}, no button`);
    }
  };

  return {
    show,
    showTwice,
    showTwoAndDismissAll,
    showAndDismiss,
    showAnchored,
    showFromModal,
  };
};
