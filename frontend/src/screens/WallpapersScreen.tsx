import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { Skeleton } from '@components/Skeleton';
import { spacing, typography, radius } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { fetchWallpapers, Wallpaper } from '@services/wallpapersApi';

const COLS = 2;
const GAP = spacing.sm;
const { width } = Dimensions.get('window');
const tileSize = (width - spacing.lg * 2 - GAP * (COLS - 1)) / COLS;

export const WallpapersScreen: React.FC = () => {
  const colors = useThemeColors();
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchWallpapers();
      setWallpapers(list);
    } catch {
      setWallpapers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <IceBackground>
      <ScreenHeader
        title="Wallpapers"
        subtitle="Papéis de parede da NHL"
        icon="images-outline"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={tileSize} style={styles.tile} />
            ))}
          </View>
        ) : wallpapers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum wallpaper disponível</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tente atualizar ou verifique o servidor.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {wallpapers.map((w) => (
              <View key={w.id} style={styles.tileWrap}>
                <Image
                  source={{ uri: w.imageUrl }}
                  style={[styles.tile, { backgroundColor: colors.border }]}
                  resizeMode="cover"
                />
                <Text style={[styles.tileTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {w.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP
  },
  tileWrap: {
    width: tileSize,
    marginBottom: GAP
  },
  tile: {
    width: tileSize,
    height: tileSize * 1.2,
    borderRadius: radius.md,
  },
  tileTitle: {
    ...typography.caption,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.subtitle,
  },
  emptySub: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
