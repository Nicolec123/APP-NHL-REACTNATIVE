import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { GameCard } from '@components/GameCard';
import { OlympicGameDetails } from '@components/OlympicGameDetails';
import { Skeleton } from '@components/Skeleton';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore } from '@store/useAppStore';
import { fetchOlympicGames } from '@services/hockeyApi';
import { normalizeOlympicGames, OlympicGameNormalized } from '../domain/olympics/phaseMapper';
import { spacing, typography, radius } from '../theme';

type OlympicGameItem = OlympicGameNormalized;

export const GameDayScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const [olympicGames, setOlympicGames] = useState<OlympicGameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'finished'>('today');
  const [selectedGame, setSelectedGame] = useState<OlympicGameItem | null>(null);

  const loadOlympic = useCallback(async () => {
    if (mode !== 'olympics') return;
    setLoading(true);
    try {
      const list = await fetchOlympicGames('2022');
      setOlympicGames(normalizeOlympicGames(list));
    } catch {
      setOlympicGames([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'olympics') loadOlympic();
  }, [mode, loadOlympic]);

  const isOlympics = mode === 'olympics';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  const filteredGames = olympicGames
    .filter(game => {
      if (genderFilter === 'male' && game.gender === 'female') return false;
      if (genderFilter === 'female' && game.gender === 'male') return false;
      const ts = game.timestamp;
      if (!ts) return true;
      if (dateFilter === 'today') {
        return ts >= startOfToday && ts <= endOfToday;
      }
      if (dateFilter === 'upcoming') {
        return ts > endOfToday && game.status !== 'finished';
      }
      if (dateFilter === 'finished') {
        return ts < startOfToday && game.status === 'finished';
      }
      return true;
    })
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  const phaseOrder: Record<string, number> = {
    'fase preliminar': 1,
    'fase do torneio': 2,
    eliminatórias: 3,
    'quartas de final': 4,
    semifinal: 5,
    'disputa de bronze': 6,
    final: 7,
  };

  const groupedByPhase: Record<string, OlympicGameItem[]> = {};
  filteredGames.forEach(game => {
    const label = game.phase ?? 'Fase do torneio';
    if (!groupedByPhase[label]) groupedByPhase[label] = [];
    groupedByPhase[label].push(game);
  });

  const orderedPhases = Object.keys(groupedByPhase).sort((a, b) => {
    const ka = phaseOrder[a.toLowerCase()] ?? 99;
    const kb = phaseOrder[b.toLowerCase()] ?? 99;
    return ka - kb;
  });

  return (
    <IceBackground>
      <ScreenHeader
        title="Game Day"
        subtitle={isOlympics ? 'Jogos olímpicos' : 'Jogos do seu time'}
        icon={isOlympics ? 'medal' : 'calendar-outline'}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          isOlympics ? (
            <RefreshControl tintColor={colors.primary} refreshing={loading} onRefresh={loadOlympic} />
          ) : undefined
        }
      >
        {!isOlympics ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Game Day</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Selecione um time favorito para ver os jogos aqui.
            </Text>
          </View>
        ) : loading ? (
          <View style={{ padding: spacing.lg }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton height={80} style={{ borderRadius: 8 }} />
              </View>
            ))}
          </View>
        ) : olympicGames.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum jogo olímpico</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Configure APISPORTS_HOCKEY_KEY no servidor.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.filtersRow}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Data</Text>
                <View style={styles.filterChips}>
                  <Text
                    onPress={() => setDateFilter('today')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: dateFilter === 'today' ? colors.primarySoft : 'transparent',
                        color: dateFilter === 'today' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Hoje
                  </Text>
                  <Text
                    onPress={() => setDateFilter('upcoming')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: dateFilter === 'upcoming' ? colors.primarySoft : 'transparent',
                        color: dateFilter === 'upcoming' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Próximos
                  </Text>
                  <Text
                    onPress={() => setDateFilter('finished')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: dateFilter === 'finished' ? colors.primarySoft : 'transparent',
                        color: dateFilter === 'finished' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Concluídos
                  </Text>
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Categoria</Text>
                <View style={styles.filterChips}>
                  <Text
                    onPress={() => setGenderFilter('all')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: genderFilter === 'all' ? colors.primarySoft : 'transparent',
                        color: genderFilter === 'all' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Todos
                  </Text>
                  <Text
                    onPress={() => setGenderFilter('male')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: genderFilter === 'male' ? colors.primarySoft : 'transparent',
                        color: genderFilter === 'male' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Masculino
                  </Text>
                  <Text
                    onPress={() => setGenderFilter('female')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: genderFilter === 'female' ? colors.primarySoft : 'transparent',
                        color: genderFilter === 'female' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Feminino
                  </Text>
                </View>
              </View>
            </View>

            {filteredGames.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum jogo para os filtros atuais</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Altere a data ou a categoria para ver outros jogos.
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
            )}
          </>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  filtersRow: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  filterGroup: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    ...typography.caption,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  phaseSection: {
    marginBottom: spacing.lg,
  },
  phaseTitle: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
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
