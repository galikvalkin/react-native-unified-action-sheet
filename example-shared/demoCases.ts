import type { ActionSheetOptionsInterface } from 'react-native-unified-action-sheet';

export interface DemoCase {
  label: string;
  options: ActionSheetOptionsInterface;
}

export const toTestID = (label: string) =>
  `demo-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;

export const buildDemoCases = (
  report: (message: string) => void
): DemoCase[] => {
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
      label: 'Button values',
      options: {
        title: 'Pick a size',
        message:
          'Each button has a value, which the result carries, typed from the buttons.',
        options: [
          { label: 'Small', value: 's' },
          { label: 'Medium', value: 'm' },
          { label: 'Large', value: 'l' },
          { label: 'Cancel', style: 'cancel', value: 'none' },
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
            accessibilityHint: 'Deletes the item permanently',
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
      label: 'Not cancelable',
      options: {
        title: 'Keep your changes?',
        message:
          'cancelable: false. A backdrop tap, back or Escape does nothing; pick a button.',
        options: [
          option('Keep'),
          { ...option('Discard'), style: 'destructive' },
        ],
        cancelable: false,
      },
    },
    {
      label: 'Not cancelable, bottom sheet',
      options: {
        title: 'Keep your changes?',
        message: 'cancelable: false. Swiping down does nothing either.',
        presentationStyle: 'bottom',
        options: [
          option('Keep'),
          { ...option('Discard'), style: 'destructive' },
        ],
        cancelable: false,
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
    {
      label: 'Bottom sheet',
      options: {
        title: 'Bottom sheet',
        message:
          'A native sheet on iOS; a Material bottom sheet on Android when the app enables Material, which example/ does and example-legacy/ does not (there it falls back to a centered dialog, with a dev warning).',
        options: [
          option('Share'),
          option('Duplicate'),
          { label: 'Delete', style: 'destructive', onPress: press('Delete') },
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        presentationStyle: 'bottom',
      },
    },
    {
      label: 'Bottom sheet, long list (drag to expand)',
      options: {
        title: 'Long bottom sheet',
        message:
          'This opens part-way; drag it up to see every row, with Cancel last.',
        options: [
          ...Array.from({ length: 16 }, (_, i) => option(`Option ${i + 1}`)),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        presentationStyle: 'bottom',
      },
    },
    {
      label: 'Bottom sheet, fits then expands (detents)',
      options: {
        title: 'Detents',
        message:
          "detents: ['auto', 'large'] opens at its own height, like a short list, and still drags up to full height.",
        options: [
          option('Share'),
          option('Duplicate'),
          option('Move'),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        presentationStyle: 'bottom',
        detents: ['auto', 'large'],
      },
    },
    {
      label: 'Preferred button (centered)',
      options: {
        title: 'Unsaved changes',
        message:
          "Save is the preferred button: bold on Android, and iOS's own emphasis (a filled button from iOS 26).",
        options: [
          { label: 'Save', preferred: true, onPress: press('Save') },
          { label: 'Discard', style: 'destructive', onPress: press('Discard') },
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        presentationStyle: 'centered',
      },
    },
    {
      label: 'Custom background, light',
      options: {
        title: 'Choose a language',
        message:
          "backgroundColor matches the app's own surface; userInterfaceStyle keeps the text readable on it. iOS alerts ignore it.",
        options: [
          option('English'),
          option('French'),
          option('Ukrainian'),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        backgroundColor: '#EAE6DF',
        userInterfaceStyle: 'light',
        tintColor: '#1565C0',
      },
    },
    {
      label: 'Custom background, dark bottom sheet',
      options: {
        title: 'Choose a language',
        options: [
          option('English'),
          option('French'),
          option('Ukrainian'),
          { label: 'Cancel', style: 'cancel', onPress: press('Cancel') },
        ],
        backgroundColor: '#1E1E1E',
        userInterfaceStyle: 'dark',
        presentationStyle: 'bottom',
      },
    },
  ];
};
