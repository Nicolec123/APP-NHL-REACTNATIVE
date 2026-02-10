const baseColors = {
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  danger: '#EF4444',
};

/** Tema NHL (padrão) */
export const colors = {
  ...baseColors,
  background: '#030712',
  surface: '#0B1220',
  surfaceCard: '#111827',
  surfaceAlt: '#020617',
  primary: '#38BDF8',
  primaryDark: '#0EA5E9',
  primarySoft: 'rgba(56, 189, 248, 0.18)',
  accent: '#F97316',
  accentSoft: 'rgba(249, 115, 22, 0.2)',
  border: '#1E293B',
  borderLight: '#334155',
  ice: 'rgba(224, 242, 254, 0.06)',
};

/** Cores dos anéis olímpicos (azul, amarelo, preto, verde, vermelho) – usadas com moderação */
export const olympicsRingColors = {
  blue: '#0081C8',
  yellow: '#FCB131',
  black: '#000000',
  green: '#00A651',
  red: '#EE334E',
};

/** Tema área Olimpíada: mantém identidade do app com toques olímpicos */
export const colorsOlympics = {
  ...baseColors,
  background: '#030712',
  surface: '#0A1628',
  surfaceCard: '#0F172A',
  surfaceAlt: '#020617',
  primary: olympicsRingColors.blue,
  primaryDark: '#006BA6',
  primarySoft: 'rgba(0, 129, 200, 0.2)',
  accent: olympicsRingColors.yellow,
  accentSoft: 'rgba(252, 177, 49, 0.2)',
  border: '#1E293B',
  borderLight: '#334155',
  ice: 'rgba(224, 242, 254, 0.06)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  titleLarge: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
  },
};

export type ThemeColors = typeof colors;
