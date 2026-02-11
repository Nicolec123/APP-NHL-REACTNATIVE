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
import { OlympicGameDetails } from '@components/OlympicGameDetails';
import { normalizeOlympicGames, OlympicGameNormalized } from '../domain/olympics/phaseMapper';

export const HomeScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const { games, isLoading, refetch } = useTodayGames();
  const [olympicGames, setOlympicGames] = useState<OlympicGameNormalized[]>([]);
  const [olympicLoading, setOlympicLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<OlympicGameNormalized | null>(null);

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

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const olympicVisible = isOlympics
    ? olympicGames
        .filter(game => {
          if (!game.timestamp) return true;
          // Home mostra jogos de hoje em diante
          return game.timestamp >= startOfToday;
        })
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    : [];

  const phaseOrder: Record<string, number> = {
    'fase preliminar': 1,
    'fase do torneio': 2,
    eliminatórias: 3,
    'quartas de final': 4,
    semifinal: 5,
    'disputa de bronze': 6,
    final: 7,
  };

  const groupedByPhase: Record<string, OlympicGameNormalized[]> = {};
  if (isOlympics) {
    olympicVisible.forEach(game => {
      const label = game.phase ?? 'Fase do torneio';
      if (!groupedByPhase[label]) groupedByPhase[label] = [];
      groupedByPhase[label].push(game);
    });
  }

  const orderedPhases = isOlympics
    ? Object.keys(groupedByPhase).sort((a, b) => {
        const ka = phaseOrder[a.toLowerCase()] ?? 99;
        const kb = phaseOrder[b.toLowerCase()] ?? 99;
        return ka - kb;
      })
    : [];

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
          olympicVisible.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum jogo olímpico disponível.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Configure APISPORTS_HOCKEY_KEY no servidor ou puxe para atualizar.
              </Text>
            </View>
          ) : (
            orderedPhases.map(phase => (
              <View key={phase} style={styles.phaseSection}>
                <Text style={[styles.phaseTitle, { color: colors.text }]}>{phase}</Text>
                {groupedByPhase[phase].map(game => {
                  const cardStatus = game.status === 'live' ? 'LIVE' : game.status === 'finished' ? 'FINAL' : 'UPCOMING';
                  const homeAbbr = game.home.name.length > 3 ? game.home.name.slice(0, 3).toUpperCase() : game.home.name;
                  const awayAbbr = game.away.name.length > 3 ? game.away.name.slice(0, 3).toUpperCase() : game.away.name;
                  return (
                    <GameCard
                      key={game.id}
                      homeTeam={homeAbbr}
                      awayTeam={awayAbbr}
                      homeLogo={game.home.logo}
                      awayLogo={game.away.logo}
                      homeScore={game.scores.home ?? undefined}
                      awayScore={game.scores.away ?? undefined}
                      startTime={`${game.dateLabel} ${game.timeLabel}`.trim()}
                      status={cardStatus}
                      league="Olimpíadas"
                      onPress={() => setSelectedGame(game)}
                    />
                  );
                })}
              </View>
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
              homeScore={game.teams.home.score}
              awayScore={game.teams.away.score}
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
      {isOlympics && selectedGame && (
        <OlympicGameDetails
          visible={!!selectedGame}
          gameId={selectedGame.id}
          onClose={() => setSelectedGame(null)}
          homeName={selectedGame.home.name}
          awayName={selectedGame.away.name}
          homeLogo={selectedGame.home.logo}
          awayLogo={selectedGame.away.logo}
        />
      )}
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
  phaseSection: {
    marginBottom: spacing.lg,
  },
  phaseTitle: {
    ...typography.caption,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
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
