import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { colors, spacing, typography } from '../theme';

export const ProfileScreen: React.FC = () => {
  return (
    <IceBackground>
      <ScreenHeader
        title="Perfil"
        subtitle="Sua conta e preferências"
        icon="person-outline"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Perfil</Text>
          <Text style={styles.emptySub}>Login e configurações serão exibidos aqui.</Text>
        </View>
      </ScrollView>
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center'
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.text
  },
  emptySub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center'
  }
});
