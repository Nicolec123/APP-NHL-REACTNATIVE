import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, typography, radius } from '../theme';
import { useAppStore } from '@store/useAppStore';
import { useThemeColors } from '@hooks/useThemeColors';
import { OlympicRingsIcon } from './OlympicRingsIcon';
import type { RootTabParamList } from '../types/navigation';

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Conteúdo entre o menu e o título (ex.: NhlHero na tela principal) */
  hero?: React.ReactNode;
};

type Nav = BottomTabNavigationProp<RootTabParamList>;

const DEFAULT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  IceHub: 'snow-outline',
  'Times da NHL': 'trophy',
  'Hockey Olímpico': 'ellipse-outline',
  Favoritos: 'star',
  Notícias: 'newspaper',
  Wallpapers: 'image',
  Perfil: 'person',
  'Game Day': 'calendar',
};

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, icon, hero }) => {
  const navigation = useNavigation<Nav>();
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const setMode = useAppStore(state => state.setMode);
  const iconName = icon ?? DEFAULT_ICONS[title] ?? (mode === 'olympics' ? 'ellipse-outline' : 'snow-outline');

  const onSwitchMode = () => {
    const nextMode = mode === 'nhl' ? 'olympics' : 'nhl';
    setMode(nextMode);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {/* 1ª linha: menu (NHL/Olimpíadas, Favoritos, Wallpapers, Perfil) */}
      <View style={styles.menuRow}>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onSwitchMode}
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            hitSlop={8}
          >
            {mode === 'nhl' ? (
              <OlympicRingsIcon size={18} />
            ) : (
              <MaterialCommunityIcons name="hockey-sticks" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Favorites')}
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            hitSlop={8}
          >
            <Ionicons name="star" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Wallpapers')}
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            hitSlop={8}
          >
            <Ionicons name="image" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.actionButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderLight }]}
            hitSlop={8}
          >
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo opcional entre menu e título (ex.: NhlHero na principal) */}
      {hero ? <View style={styles.heroWrap}>{hero}</View> : null}

      {/* 2ª linha: título da tela */}
      <View style={styles.titleRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
              ...(Platform.OS === 'ios'
                ? {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                  }
                : { elevation: 4 }),
            },
          ]}
        >
          <Ionicons name={iconName} size={28} color={colors.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
  },
  heroWrap: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingRight: spacing.sm,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xl,
    borderWidth: 1.5,
  },
  textBlock: { flex: 1, minWidth: 0, paddingRight: spacing.xs },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
    opacity: 0.95,
  },
});
