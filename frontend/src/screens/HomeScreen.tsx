import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Text, StyleSheet } from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { NhlHero } from '@components/NhlHero';
import { OlympicHero } from '@components/OlympicHero';
import { ScreenHeader } from '@components/ScreenHeader';
import { GameCard } from '@components/GameCard';
import { Skeleton } from '@components/Skeleton';
import { useTodayGames } from '@services/nhlHooks';
import { fetchOlympicGames } from '@services/hockeyApi';
import { useAppStore } from '@store/useAppStore';
import { useThemeColors } from '@hooks/useThemeColors';
import { spacing, typography } from '../theme';

type OlympicGameItem = {
  id: number;
  homeName: string;
  awayName: string;
  date: string;
  time: string;
  status: 'LIVE' | 'FINAL' | 'UPCOMING';
  homeScore?: number;
  awayScore?: number;
};

function normalizeOlympicGames(data: any[]): OlympicGameItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((g: any) => {
    const game = g.game ?? g;
    const teams = g.teams ?? game.teams ?? {};
    const home = teams.home ?? {};
    const away = teams.away ?? {};
    const scores = g.scores ?? game.scores ?? {};
    const status = (game.status?.short ?? g.status?.short ?? '').toUpperCase();
    const isLive = status === 'LIVE' || status === '1H' || status === '2H' || status === '3H';
    const isFinal = status === 'FT' || status === 'AOT' || status === 'AWD' || status === 'WO' || status === 'FIN';
    let cardStatus: 'LIVE' | 'FINAL' | 'UPCOMING' = 'UPCOMING';
    if (isLive) cardStatus = 'LIVE';
    else if (isFinal) cardStatus = 'FINAL';
    const d = game.date ?? g.date ?? '';
    const t = game.time ?? g.time ?? '';
    const dateStr = d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
    const timeStr = t || (d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
    return {
      id: game.id ?? g.id ?? 0,
      homeName: home.name ?? game.home?.name ?? 'TBD',
      awayName: away.name ?? game.away?.name ?? 'TBD',
      date: dateStr,
      time: timeStr,
      status: cardStatus,
      homeScore: scores.home ?? game.scores?.home,
      awayScore: scores.away ?? game.scores?.away
    };
  });
}

export const HomeScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const { games, isLoading, refetch } = useTodayGames();
  const [olympicGames, setOlympicGames] = useState<OlympicGameItem[]>([]);
  const [olympicLoading, setOlympicLoading] = useState(false);

  const loadOlympic = useCallback(async () => {
    if (mode !== 'olympics') return;
    setOlympicLoading(true);
    try {
      const list = await fetchOlympicGames('2022');
      setOlympicGames(normalizeOlympicGames(list));
    } catch {
      setOlympicGames([]);
    } finally {
      setOlympicLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'olympics') loadOlympic();
  }, [mode, loadOlympic]);

  const isOlympics = mode === 'olympics';
  const loading = isOlympics ? olympicLoading : isLoading;
  const onRefresh = isOlympics ? loadOlympic : refetch;

  return (
    <IceBackground>
      <ScreenHeader
        title={isOlympics ? 'Hockey Olímpico' : 'IceHub'}
        subtitle={isOlympics ? 'Jogos e novidades das Olimpíadas' : 'Jogos de hoje e novidades da NHL'}
        icon={isOlympics ? 'medal' : 'snow-outline'}
        hero={isOlympics ? <OlympicHero /> : <NhlHero />}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl tintColor={colors.primary} onRefresh={onRefresh} refreshing={loading} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isOlympics ? 'Jogos olímpicos' : 'Jogos de hoje'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {isOlympics ? 'Hockey nas Olimpíadas de Inverno' : 'Atualizado em tempo quase real'}
          </Text>
        </View>

        {loading ? (
          <View>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
                <Skeleton height={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton height={16} />
                <Skeleton height={10} style={{ marginTop: spacing.sm, width: '40%' }} />
              </View>
            ))}
          </View>
        ) : isOlympics ? (
          olympicGames.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum jogo olímpico disponível.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Configure APISPORTS_HOCKEY_KEY no servidor ou puxe para atualizar.
              </Text>
            </View>
          ) : (
            olympicGames.map((game) => (
              <GameCard
                key={game.id}
                homeTeam={game.homeName.length > 3 ? game.homeName.slice(0, 3).toUpperCase() : game.homeName}
                awayTeam={game.awayName.length > 3 ? game.awayName.slice(0, 3).toUpperCase() : game.awayName}
                startTime={`${game.date} ${game.time}`.trim()}
                status={game.status}
                league="Olimpíadas"
              />
            ))
          )
        ) : games.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum jogo hoje na NHL.</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Puxe para atualizar ou volte mais tarde.</Text>
          </View>
        ) : (
          games.map((game) => (
            <GameCard
              key={game.gamePk}
              homeTeam={game.teams.home.team.abbreviation}
              awayTeam={game.teams.away.team.abbreviation}
              startTime={game.gameDateLocal}
              status={
                game.status.statusCode === '3'
                  ? 'FINAL'
                  : game.status.abstractGameState === 'Live'
                    ? 'LIVE'
                    : 'UPCOMING'
              }
            />
          ))
        )}
      </ScrollView>
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.subtitle,
  },
  emptySub: {
    ...typography.caption,
    marginTop: 4,
  },
});
