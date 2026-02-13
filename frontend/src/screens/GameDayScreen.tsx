import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { GameCard } from '@components/GameCard';
import { OlympicGameDetails } from '@components/OlympicGameDetails';
import { Skeleton } from '@components/Skeleton';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore } from '@store/useAppStore';
import { fetchOlympicGames } from '@services/hockeyApi';
import {
  normalizeOlympicGames,
  OlympicGameNormalized,
  PHASE_ORDER,
  PHASE_TITLES,
  PHASE_ICONS,
  groupByPhase,
  type PhaseKey,
} from '../domain/olympics/phaseMapper';
import { spacing, typography, radius } from '../theme';

type OlympicGameItem = OlympicGameNormalized;

export const GameDayScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const incrementGamesWatched = useAppStore(state => state.incrementGamesWatched);
  const [olympicGames, setOlympicGames] = useState<OlympicGameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'finished' | 'all'>('all');
  const [selectedGame, setSelectedGame] = useState<OlympicGameItem | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() =>
    PHASE_ORDER.reduce((o, k) => ({ ...o, [k]: true }), {})
  );

  const togglePhase = useCallback((phaseKey: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  }, []);

  const loadOlympic = useCallback(async () => {
    if (mode !== 'olympics') return;
    setLoading(true);
    try {
      const list = await fetchOlympicGames();
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

  // ETAPA 3 – Olimpíada não é liga contínua: mostrar todos os jogos (ou filtrar por data se usuário escolher), ordenar pela data mais próxima
  const filteredGames = olympicGames
    .filter(game => {
      if (genderFilter === 'male' && game.gender === 'female') return false;
      if (genderFilter === 'female' && game.gender === 'male') return false;
      if (dateFilter === 'all') return true;
      const ts = game.timestamp;
      if (!ts) return true;
      if (dateFilter === 'today') return ts >= startOfToday && ts <= endOfToday;
      if (dateFilter === 'upcoming') return ts > endOfToday && game.status !== 'finished';
      if (dateFilter === 'finished') return ts < startOfToday && game.status === 'finished';
      return true;
    })
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  const groupedByPhase = useMemo(() => groupByPhase(filteredGames), [filteredGames]);

  const orderedPhasesWithGames = useMemo(
    () => PHASE_ORDER.filter(phaseKey => (groupedByPhase[phaseKey]?.length ?? 0) > 0),
    [groupedByPhase]
  );

  return (
    <IceBackground>
      <ScreenHeader
        title="Game Day"
        subtitle={undefined}
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
            <Text style={[styles.emptyText, { color: colors.text }]}>Jogos indisponíveis no momento</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Puxe para atualizar ou tente novamente em instantes.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.filtersRow}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Data</Text>
                <View style={styles.filterChips}>
                  <Text
                    onPress={() => setDateFilter('all')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: dateFilter === 'all' ? colors.primarySoft : 'transparent',
                        color: dateFilter === 'all' ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    Todos
                  </Text>
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
                  Toque em «Todos» na data para ver todos os jogos.
                </Text>
              </View>
            ) : (
              orderedPhasesWithGames.map(phaseKey => {
                const games = groupedByPhase[phaseKey];
                if (!games?.length) return null;
                const isExpanded = expandedPhases[phaseKey] !== false;
                const isFinal = phaseKey === 'final';
                return (
                  <View
                    key={phaseKey}
                    style={[
                      styles.phaseSection,
                      isFinal && styles.phaseSectionFinal,
                      isFinal && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.phaseSectionHeader,
                        pressed && styles.phaseSectionHeaderPressed,
                      ]}
                      onPress={() => togglePhase(phaseKey)}
                    >
                      <Ionicons
                        name={PHASE_ICONS[phaseKey] as keyof typeof Ionicons.glyphMap}
                        size={22}
                        color={isFinal ? colors.accent : colors.primary}
                      />
                      <Text
                        style={[
                          styles.phaseSectionTitle,
                          { color: colors.text },
                          isFinal && styles.phaseSectionTitleFinal,
                          isFinal && { color: colors.accent },
                        ]}
                      >
                        {PHASE_TITLES[phaseKey]}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                    {isExpanded && (
                      <View style={styles.phaseSectionContent}>
                        {games
                          .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
                          .map(game => {
                            const cardStatus =
                              game.status === 'live' ? 'LIVE' : game.status === 'finished' ? 'FINAL' : 'UPCOMING';
                            const homeAbbr =
                              game.home.name.length > 3 ? game.home.name.slice(0, 3).toUpperCase() : game.home.name;
                            const awayAbbr =
                              game.away.name.length > 3 ? game.away.name.slice(0, 3).toUpperCase() : game.away.name;
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
                                onPress={() => {
                                  incrementGamesWatched();
                                  setSelectedGame(game);
                                }}
                              />
                            );
                          })}
                      </View>
                    )}
                  </View>
                );
              })
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
          dateLabel={selectedGame.dateLabel}
          timeLabel={selectedGame.timeLabel}
          phaseLabel={selectedGame.phase}
          statusLabel={
            selectedGame.status === 'live'
              ? 'Ao vivo'
              : selectedGame.status === 'finished'
              ? 'Finalizado'
              : 'Agendado'
          }
          genderLabel={selectedGame.gender === 'female' ? 'Feminino' : 'Masculino'}
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  phaseSectionFinal: {
    borderWidth: 2,
  },
  phaseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  phaseSectionHeaderPressed: {
    opacity: 0.85,
  },
  phaseSectionTitle: {
    ...typography.subtitle,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phaseSectionTitleFinal: {
    fontWeight: '700',
  },
  phaseSectionContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
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
