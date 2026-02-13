import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { spacing, typography, radius } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { fetchOlympicGameStats, type OlympicGameDetailsData } from '@services/hockeyApi';

type Props = {
  visible: boolean;
  gameId: number | null;
  onClose: () => void;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  dateLabel?: string;
  timeLabel?: string;
  phaseLabel?: string;
  statusLabel?: string;
  genderLabel?: string;
};

export const OlympicGameDetails: React.FC<Props> = ({
  visible,
  gameId,
  onClose,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  dateLabel,
  timeLabel,
  phaseLabel,
  statusLabel,
  genderLabel,
}) => {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OlympicGameDetailsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!visible || !gameId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOlympicGameStats(gameId);
        if (!cancelled) setDetail(data ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Não foi possível carregar detalhes da partida.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [visible, gameId]);

  const scores = detail?.scores ?? {};
  const homeScore = scores.home ?? 0;
  const awayScore = scores.away ?? 0;
  const displayStatus = statusLabel ?? '';
  const displayDateTime = [dateLabel, timeLabel].filter(Boolean).join(' – ') || '';
  const arena = detail?.arena ?? '';
  const phaseLine = [displayStatus, phaseLabel].filter(Boolean).join(' | ');
  const periods = detail?.periods ?? [
    { home: 0, away: 0 },
    { home: 0, away: 0 },
    { home: 0, away: 0 },
  ];
  const totalHome = periods.reduce((s, p) => s + (p?.home ?? 0), 0);
  const totalAway = periods.reduce((s, p) => s + (p?.away ?? 0), 0);
  const stats = detail?.stats;
  const events = detail?.events ?? [];
  const stars = detail?.stars ?? [];

  // Agrupa eventos por período (1º, 2º, 3º)
  const eventsByPeriod = events.reduce<Record<number, typeof events>>((acc, ev) => {
    const p = ev.period ?? 1;
    if (!acc[p]) acc[p] = [];
    acc[p].push(ev);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Detalhes da partida</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={[styles.closeText, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* 1. Cabeçalho: times, bandeiras, placar, fase, arena, data/hora, status */}
            <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={styles.teamsRow}>
                <View style={styles.team}>
                  {homeLogo ? (
                    <Image source={{ uri: homeLogo }} style={[styles.logo, { backgroundColor: colors.surface }]} />
                  ) : null}
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {homeName}
                  </Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={[styles.score, { color: colors.text }]}>{homeScore}</Text>
                  <Text style={[styles.scoreSep, { color: colors.textSecondary }]}>—</Text>
                  <Text style={[styles.score, { color: colors.text }]}>{awayScore}</Text>
                </View>
                <View style={styles.team}>
                  {awayLogo ? (
                    <Image source={{ uri: awayLogo }} style={[styles.logo, { backgroundColor: colors.surface }]} />
                  ) : null}
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {awayName}
                  </Text>
                </View>
              </View>
              {phaseLine ? (
                <Text style={[styles.infoLine, { color: colors.textSecondary }]}>{phaseLine}</Text>
              ) : null}
              {arena ? (
                <Text style={[styles.infoLine, { color: colors.textSecondary }]}>{arena}</Text>
              ) : null}
              {displayDateTime ? (
                <Text style={[styles.infoLine, { color: colors.textSecondary }]}>{displayDateTime}</Text>
              ) : null}
              {genderLabel ? (
                <Text style={[styles.infoLine, { color: colors.textSecondary }]}>{genderLabel}</Text>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Carregando...</Text>
              </View>
            ) : error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : (
              <>
                {/* 2. Placar por período */}
                <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Períodos</Text>
                  <View style={[styles.periodTable, { borderColor: colors.border }]}>
                    <View style={[styles.periodRow, styles.periodHeader, { borderColor: colors.border }]}>
                      <Text style={[styles.periodCell, styles.periodCellHeader, { color: colors.textSecondary }]}> </Text>
                      <Text style={[styles.periodCell, styles.periodCellHeader, { color: colors.textSecondary }]}>1º</Text>
                      <Text style={[styles.periodCell, styles.periodCellHeader, { color: colors.textSecondary }]}>2º</Text>
                      <Text style={[styles.periodCell, styles.periodCellHeader, { color: colors.textSecondary }]}>3º</Text>
                      <Text style={[styles.periodCell, styles.periodCellHeader, { color: colors.textSecondary }]}>Total</Text>
                    </View>
                    <View style={[styles.periodRow, { borderColor: colors.border }]}>
                      <Text style={[styles.periodCell, { color: colors.text }]} numberOfLines={1}>{homeName}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[0]?.home ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[1]?.home ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[2]?.home ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.primary, fontWeight: '700' }]}>{totalHome}</Text>
                    </View>
                    <View style={[styles.periodRow, { borderColor: colors.border }]}>
                      <Text style={[styles.periodCell, { color: colors.text }]} numberOfLines={1}>{awayName}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[0]?.away ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[1]?.away ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.text }]}>{periods[2]?.away ?? 0}</Text>
                      <Text style={[styles.periodCell, styles.periodCellCenter, { color: colors.primary, fontWeight: '700' }]}>{totalAway}</Text>
                    </View>
                  </View>
                </View>

                {/* 3. Estatísticas */}
                {stats && (stats.shots || stats.penalties || stats.powerPlay || stats.faceoffs) && (
                  <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Estatísticas</Text>
                    {stats.shots && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Chutes</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.shots.home} — {stats.shots.away}
                        </Text>
                      </View>
                    )}
                    {stats.penalties && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Penalidades</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.penalties.home} — {stats.penalties.away}
                        </Text>
                      </View>
                    )}
                    {stats.powerPlay && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Power play</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.powerPlay.home} — {stats.powerPlay.away}
                        </Text>
                      </View>
                    )}
                    {stats.faceoffs && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Faceoffs</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.faceoffs.home} — {stats.faceoffs.away}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 4. Eventos da partida (timeline) */}
                {events.length > 0 && (
                  <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Eventos da partida</Text>
                    {[1, 2, 3].map((periodNum) => {
                      const periodEvents = eventsByPeriod[periodNum];
                      if (!periodEvents?.length) return null;
                      return (
                        <View key={periodNum} style={styles.timelineBlock}>
                          <Text style={[styles.timelinePeriodLabel, { color: colors.textSecondary }]}>
                            {periodNum}º período
                          </Text>
                          {periodEvents.map((ev, i) => (
                            <View key={i} style={styles.timelineRow}>
                              <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>{ev.time}</Text>
                              <Text style={[styles.timelineText, { color: colors.text }]}>
                                {ev.type === 'goal' && (ev.player ? `Gol – ${ev.player}` : 'Gol')}
                                {ev.type === 'penalty' && (`Pênalti – ${ev.detail ?? 'Pênalti'}`)}
                                {ev.type !== 'goal' && ev.type !== 'penalty' && (
                                  <>{ev.player ?? ev.detail ?? ev.type}</>
                                )}
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* 5. Jogadores destaque */}
                {stars.length > 0 && (
                  <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>⭐ Destaques</Text>
                    {stars.map((line, i) => (
                      <Text key={i} style={[styles.starLine, { color: colors.text }]}>
                        {line}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle,
  },
  closeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    resizeMode: 'contain',
  },
  teamName: {
    ...typography.caption,
    textAlign: 'center',
    maxWidth: '90%',
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  score: {
    ...typography.title,
    fontSize: 24,
  },
  scoreSep: {
    ...typography.body,
  },
  infoLine: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  loading: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  cardTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  periodTable: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  periodRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  periodHeader: {
    backgroundColor: 'transparent',
  },
  periodCell: {
    ...typography.caption,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    flex: 1,
  },
  periodCellHeader: {
    fontWeight: '600',
  },
  periodCellCenter: {
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.caption,
    fontWeight: '600',
  },
  timelineBlock: {
    marginBottom: spacing.md,
  },
  timelinePeriodLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    gap: spacing.sm,
  },
  timelineTime: {
    ...typography.caption,
    minWidth: 40,
  },
  timelineText: {
    ...typography.caption,
    flex: 1,
  },
  starLine: {
    ...typography.caption,
    marginVertical: 2,
  },
});
