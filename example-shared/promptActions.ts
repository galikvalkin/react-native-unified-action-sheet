import { showPromptWithOptions } from 'react-native-unified-action-sheet';

export const createPromptActions = (report: (message: string) => void) => {
  const showPrompt = async () => {
    // The gap this fills: React Native's own Alert.prompt is iOS-only and does
    // nothing at all on Android.
    const result = await showPromptWithOptions({
      onShow: () => report('Prompt → shown'),
      testID: 'demo-rename-prompt',
      fieldTestID: 'demo-rename-field',
      title: 'Rename item',
      message: 'Type a new name.',
      placeholder: 'New name',
      defaultValue: 'Untitled',
      options: [
        {
          label: 'Save',
          preferred: true,
          onPress: ({ text }) => report(`Prompt → saved “${text}”`),
        },
        {
          label: 'Delete',
          style: 'destructive',
          onPress: () => report('Prompt → Delete'),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: ({ text }) =>
            report(`Prompt → cancelled, draft was “${text}”`),
        },
      ],
    });

    if (result.reason === 'dismissed') {
      report(`Prompt → dismissed from code, draft was “${result.text}”`);
    }
  };

  const showSecurePrompt = async () => {
    const result = await showPromptWithOptions({
      title: 'Enter passcode',
      placeholder: 'Passcode',
      type: 'secure-text',
      keyboardType: 'numeric',
      options: [
        {
          label: 'Unlock',
          requiresText: true,
          onPress: ({ text }) =>
            report(`Secure prompt → ${text.length} digits entered`),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => report('Secure prompt → cancelled'),
        },
      ],
    });

    if (result.reason === 'dismissed') {
      report('Secure prompt → dismissed');
    }
  };

  const showLoginPrompt = async () => {
    // Two fields, as with React Native's Alert.prompt 'login-password'. Sign in
    // stays disabled until both are filled, and is the preferred button, so
    // the keyboard's return key presses it.
    await showPromptWithOptions({
      title: 'Sign in',
      type: 'login-password',
      placeholder: 'Email',
      passwordPlaceholder: 'Password',
      fieldTestID: 'demo-sign-in-email',
      passwordFieldTestID: 'demo-sign-in-password',
      keyboardType: 'email-address',
      options: [
        {
          label: 'Sign in',
          preferred: true,
          requiresText: true,
          onPress: ({ text, password }) =>
            report(
              `Sign in → ${text}, ${password?.length ?? 0}-character password`
            ),
        },
        {
          label: 'Cancel',
          style: 'cancel',
          onPress: () => report('Sign in → cancelled'),
        },
      ],
    });
  };

  return { showPrompt, showSecurePrompt, showLoginPrompt };
};
