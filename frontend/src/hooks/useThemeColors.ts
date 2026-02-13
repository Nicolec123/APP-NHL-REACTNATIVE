import { useAppStore } from '@store/useAppStore';
import { getThemeColors } from '../theme';
import type { ThemeColors } from '../theme';

export function useThemeColors(): ThemeColors {
  const mode = useAppStore(state => state.mode);
  const darkMode = useAppStore(state => state.darkMode);
  return getThemeColors(mode, darkMode);
}
