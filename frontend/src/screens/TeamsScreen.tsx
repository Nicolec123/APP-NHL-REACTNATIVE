import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { Skeleton } from '@components/Skeleton';
import { spacing, radius, typography } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { nhlApi } from '@services/nhlApi';
import { fetchOlympicTeams, OlympicTeam } from '@services/hockeyApi';
import { useAppStore } from '@store/useAppStore';

type NhlTeam = {
  id: number;
  name: string;
  teamName?: string;
  abbreviation: string;
  division?: { name: string };
};

type TeamsResponse = {
  teams: NhlTeam[];
};

export const TeamsScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const [nhlTeams, setNhlTeams] = useState<NhlTeam[]>([]);
  const [olympicTeams, setOlympicTeams] = useState<OlympicTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const favoriteTeams = useAppStore(state => state.favoriteTeams);
  const favoriteOlympicTeams = useAppStore(state => state.favoriteOlympicTeams);
  const toggleFavoriteTeam = useAppStore(state => state.toggleFavoriteTeam);
  const toggleFavoriteOlympicTeam = useAppStore(state => state.toggleFavoriteOlympicTeam);

  const loadNhl = useCallback(async () => {
    try {
      const response = await nhlApi.get<TeamsResponse>('/teams');
      const list = response.teams ?? (response as any).data?.teams ?? [];
      setNhlTeams(list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })));
    } catch {
      setNhlTeams([]);
    }
  }, []);

  const loadOlympic = useCallback(async () => {
    try {
      const list = await fetchOlympicTeams('2022');
      setOlympicTeams(Array.isArray(list) ? list : []);
    } catch {
      setOlympicTeams([]);
    }
  }, []);

  async function loadTeams() {
    setLoading(true);
    if (mode === 'olympics') await loadOlympic();
    else await loadNhl();
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadTeams();
  }, [mode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const isOlympics = mode === 'olympics';
  const teams = isOlympics ? olympicTeams : nhlTeams;
  const favorites = isOlympics ? favoriteOlympicTeams : favoriteTeams;
  const toggleFavorite = isOlympics ? toggleFavoriteOlympicTeam : toggleFavoriteTeam;

  return (
    <IceBackground>
      <ScreenHeader
        title={isOlympics ? 'Seleções Olímpicas' : 'Times da NHL'}
        subtitle={isOlympics ? 'Hockey nas Olimpíadas – selecione favoritos' : 'Selecione seus favoritos para personalizar o app'}
        icon={isOlympics ? 'medal' : 'shield-checkmark-outline'}
      />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <View key={idx} style={{ marginBottom: spacing.sm }}>
              <Skeleton height={52} rounded />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isFavorite = favorites.includes(item.id);
            const abbr = isOlympics
              ? (item as OlympicTeam).name?.slice(0, 3).toUpperCase() || '—'
              : (item as NhlTeam).abbreviation;
            const logo = isOlympics ? (item as OlympicTeam).logo : undefined;
            const subtitle = isOlympics
              ? (item as OlympicTeam).country?.name ?? 'Olimpíadas'
              : (item as NhlTeam).division?.name?.replace(' Division', '') ?? 'Divisão desconhecida';
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => toggleFavorite(item.id)}
              >
                <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.logoImage} />
                  ) : (
                    <Text style={[styles.logoText, { color: colors.primary }]}>{abbr}</Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={[styles.teamName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.teamMeta, { color: colors.textSecondary }]}>{subtitle}</Text>
                </View>
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={22}
                  color={isFavorite ? colors.accent : colors.textSecondary}
                />
              </TouchableOpacity>
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
  info: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  teamName: {
    ...typography.body,
  },
  teamMeta: {
    ...typography.caption,
    marginTop: 2,
  },
});

