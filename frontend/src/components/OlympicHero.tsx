import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { OlympicRingsIcon } from './OlympicRingsIcon';
import { spacing, typography } from '../theme';

/** Hero da área Olimpíadas: apenas o ícone oficial dos anéis + texto, sem medalha nem círculos coloridos. */
export const OlympicHero: React.FC = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <OlympicRingsIcon size={56} />
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>Hockey nas Olimpíadas</Text>
      <View style={[styles.line, { backgroundColor: colors.accent }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  line: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginTop: spacing.md,
  },
});
