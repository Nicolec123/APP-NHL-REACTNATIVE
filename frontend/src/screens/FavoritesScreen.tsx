import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Image } from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { Skeleton } from '@components/Skeleton';
import { spacing, radius, typography } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore } from '@store/useAppStore';
import { nhlApi } from '@services/nhlApi';
import { fetchOlympicTeams, OlympicTeam } from '@services/hockeyApi';

type NhlTeam = {
  id: number;
  name: string;
  abbreviation: string;
  division?: { name: string };
};

type TeamsResponse = { teams: NhlTeam[] };

export const FavoritesScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const favoriteTeams = useAppStore(state => state.favoriteTeams);
  const favoriteOlympicTeams = useAppStore(state => state.favoriteOlympicTeams);
  const [nhlTeams, setNhlTeams] = useState<NhlTeam[]>([]);
  const [olympicTeams, setOlympicTeams] = useState<OlympicTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (mode === 'olympics') {
      if (favoriteOlympicTeams.length === 0) {
        setOlympicTeams([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        const all = await fetchOlympicTeams('2026');
        setOlympicTeams(all.filter(t => favoriteOlympicTeams.includes(t.id)));
      } catch {
        setOlympicTeams([]);
      }
    } else {
      if (favoriteTeams.length === 0) {
        setNhlTeams([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        const response = await nhlApi.get<TeamsResponse>('/teams');
        const list = response.teams ?? (response as any).data?.teams ?? [];
        setNhlTeams(list.filter((t: NhlTeam) => favoriteTeams.includes(t.id)));
      } catch {
        setNhlTeams([]);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, [mode, favoriteTeams.join(','), favoriteOlympicTeams.join(',')]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const isOlympics = mode === 'olympics';
  const teams = isOlympics ? olympicTeams : nhlTeams;
  const emptyMsg = isOlympics
    ? 'Vá em Seleções Olímpicas e toque na estrela para adicionar.'
    : 'Vá em Times e toque na estrela para adicionar.';

  return (
    <IceBackground>
      <ScreenHeader
        title="Favoritos"
        subtitle={isOlympics ? 'Seleções olímpicas favoritas' : 'Times que você marcou como favoritos'}
        icon="star-outline"
      />
      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <View key={idx} style={{ marginBottom: spacing.sm }}>
              <Skeleton height={52} rounded />
            </View>
          ))}
        </View>
      ) : teams.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum favorito</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{emptyMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const abbr = isOlympics
              ? (item as OlympicTeam).name?.slice(0, 3).toUpperCase() || '—'
              : (item as NhlTeam).abbreviation;
            const logo = isOlympics ? (item as OlympicTeam).logo : undefined;
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.logoImage} />
                  ) : (
                    <Text style={[styles.logoText, { color: colors.primary }]}>{abbr}</Text>
                  )}
                </View>
                <Text style={[styles.teamName, { color: colors.text }]}>{item.name}</Text>
              </View>
            );
          }}
        />
      )}
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  logoText: {
    ...typography.subtitle,
  },
  teamName: {
    ...typography.body,
  },
  empty: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
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
