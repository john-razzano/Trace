export const Colors = {
  light: {
    background: '#F5F2EB',
    line: '#2C2C2C',
    controls: '#9A9590',
    accent: '#C4A484',
    controlsOpacity: 0.6,
  },
  dark: {
    background: '#1A1B2E',
    line: '#E8E4DC',
    controls: '#6B6B7B',
    accent: '#D4B896',
    controlsOpacity: 0.6,
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
