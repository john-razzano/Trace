import { useColorScheme } from 'react-native';
import { Colors, ThemeMode } from '../constants/colors';

export function useTheme(themeMode: ThemeMode = 'system') {
  const systemColorScheme = useColorScheme();

  const activeTheme = themeMode === 'system'
    ? systemColorScheme || 'light'
    : themeMode;

  return Colors[activeTheme];
}
