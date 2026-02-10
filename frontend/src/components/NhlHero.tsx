import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';
import { useThemeColors } from '../hooks/useThemeColors';

export const NhlHero: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/nhl-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo NHL"
      />
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>National Hockey League</Text>
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
  logo: {
    width: 180,
    height: 130,
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  line: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginTop: spacing.md,
  },
});
