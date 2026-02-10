import { useAppStore } from '@store/useAppStore';
import { colors, colorsOlympics } from '../theme';
import type { ThemeColors } from '../theme';

export function useThemeColors(): ThemeColors {
  const mode = useAppStore(state => state.mode);
  return mode === 'olympics' ? colorsOlympics : colors;
}
