import { useColorScheme } from 'react-native';

export const palettes = {
  light: {
    background: '#FFFFFF',
    text: '#1B1B1B',
    secondaryText: '#444444',
    border: '#00000022',
    card: '#FFFFFF',
    tint: '#007AFF',
    tintFill: 'rgba(0, 122, 255, 0.12)',
    altTint: '#5856D6',
    altTintFill: 'rgba(88, 86, 214, 0.12)',
  },
  dark: {
    background: '#121212',
    text: '#F2F2F2',
    secondaryText: '#BBBBBB',
    border: '#FFFFFF22',
    card: '#1E1E1E',
    tint: '#0A84FF',
    tintFill: 'rgba(10, 132, 255, 0.2)',
    altTint: '#5E5CE6',
    altTintFill: 'rgba(94, 92, 230, 0.24)',
  },
};

export const usePalette = () =>
  useColorScheme() === 'dark' ? palettes.dark : palettes.light;
