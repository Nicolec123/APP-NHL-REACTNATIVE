import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { GameCard } from '@components/GameCard';
import { OlympicGameDetails } from '@components/OlympicGameDetails';
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

const EDICOES: { year: string; label: string }[] = [
  { year: '2022', label: 'Pequim 2022' },
  { year: '2018', label: 'PyeongChang 2018' },
  { year: '2014', label: 'Sochi 2014' },
  { year: '2010', label: 'Vancouver 2010' },
];

export const OlympicsConcluidosScreen: React.FC = () => {
  const colors = useThemeColors();
  const incrementGamesWatched = useAppStore(state => state.incrementGamesWatched);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [games, setGames] = useState<OlympicGameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<OlympicGameItem | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() =>
    PHASE_ORDER.reduce((o, k) => ({ ...o, [k]: true }), {})
  );

  const togglePhase = useCallback((phaseKey: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  }, []);

  const loadYear = useCallback(async (year: string) => {
    setSelectedYear(year);
    setLoading(true);
    try {
      const list = await fetchOlympicGames(year);
      setGames(normalizeOlympicGames(list));
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedYear(null);
    setGames([]);
    setSelectedGame(null);
  }, []);

  const onRefresh = useCallback(() => {
    if (selectedYear) loadYear(selectedYear);
  }, [selectedYear, loadYear]);

  const selectedEdicao = useMemo(
    () => EDICOES.find(e => e.year === selectedYear),
    [selectedYear]
  );

  const groupedByPhase = useMemo(() => groupByPhase(games), [games]);
  const orderedPhasesWithGames = useMemo(
    () => PHASE_ORDER.filter(phaseKey => (groupedByPhase[phaseKey]?.length ?? 0) > 0),
    [groupedByPhase]
  );

  return (
    <IceBackground>
      <ScreenHeader
        title="Concluídos"
        subtitle={undefined}
        icon="medal"
      />
      {selectedYear ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.backRow, pressed && styles.backRowPressed]}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Voltar às edições</Text>
          </Pressable>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl tintColor={colors.primary} refreshing={loading} onRefresh={onRefresh} />
            }
          >
            {loading && games.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Carregando jogos…
                </Text>
              </View>
            ) : games.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Nenhum jogo encontrado para esta edição
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Toque em «Voltar» e escolha outra edição.
                </Text>
              </View>
            ) : (
              orderedPhasesWithGames.map(phaseKey => {
                const phaseGames = groupedByPhase[phaseKey];
                if (!phaseGames?.length) return null;
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
                        {phaseGames
                          .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
                          .map(game => {
                            const cardStatus =
                              game.status === 'live'
                                ? 'LIVE'
                                : game.status === 'finished'
                                ? 'FINAL'
                                : 'UPCOMING';
                            const homeAbbr =
                              game.home.name.length > 3
                                ? game.home.name.slice(0, 3).toUpperCase()
                                : game.home.name;
                            const awayAbbr =
                              game.away.name.length > 3
                                ? game.away.name.slice(0, 3).toUpperCase()
                                : game.away.name;
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
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Escolha uma edição para ver as partidas
          </Text>
          {EDICOES.map(({ year, label }) => (
            <Pressable
              key={year}
              style={({ pressed }) => [
                styles.yearCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.yearCardPressed,
              ]}
              onPress={() => loadYear(year)}
            >
              <Ionicons name="trophy" size={28} color={colors.primary} />
              <Text style={[styles.yearLabel, { color: colors.text }]}>{label}</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
      {selectedGame && (
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  backRowPressed: { opacity: 0.85 },
  backText: {
    ...typography.body,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: { ...typography.caption },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { ...typography.subtitle },
  emptySub: { ...typography.caption, marginTop: spacing.sm, textAlign: 'center' },
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  yearCardPressed: { opacity: 0.9 },
  yearLabel: { ...typography.subtitle, flex: 1 },
  phaseSection: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  phaseSectionFinal: { borderWidth: 2 },
  phaseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  phaseSectionHeaderPressed: { opacity: 0.85 },
  phaseSectionTitle: {
    ...typography.subtitle,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phaseSectionTitleFinal: { fontWeight: '700' },
  phaseSectionContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
