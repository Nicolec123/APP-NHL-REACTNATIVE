import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { spacing, typography } from '../theme';
import { useThemeColors } from '@hooks/useThemeColors';
import { fetchOlympicGameStats } from '@services/hockeyApi';

type Props = {
  visible: boolean;
  gameId: number | null;
  onClose: () => void;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
};

export const OlympicGameDetails: React.FC<Props> = ({
  visible,
  gameId,
  onClose,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
}) => {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!visible || !gameId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOlympicGameStats(gameId);
        if (!cancelled) setStats(data);
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

  const gameInfo = stats?.game ?? stats ?? {};
  const teams = stats?.teams ?? {};
  const scores = stats?.scores ?? gameInfo.scores ?? {};
  const statistics = stats?.statistics ?? {};

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

          <ScrollView contentContainerStyle={styles.content}>
            {/* Header do jogo */}
            <View style={styles.teamsRow}>
              <View style={styles.team}>
                {homeLogo ? (
                  <Image source={{ uri: homeLogo }} style={[styles.logo, { backgroundColor: colors.surfaceCard }]} />
                ) : null}
                <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                  {homeName}
                </Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={[styles.score, { color: colors.text }]}>
                  {scores.home ?? teams.home?.goals ?? gameInfo.goals?.home ?? '-'}
                </Text>
                <Text style={[styles.scoreSep, { color: colors.textSecondary }]}>:</Text>
                <Text style={[styles.score, { color: colors.text }]}>
                  {scores.away ?? teams.away?.goals ?? gameInfo.goals?.away ?? '-'}
                </Text>
              </View>
              <View style={styles.team}>
                {awayLogo ? (
                  <Image source={{ uri: awayLogo }} style={[styles.logo, { backgroundColor: colors.surfaceCard }]} />
                ) : null}
                <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                  {awayName}
                </Text>
              </View>
            </View>

            <Text style={[styles.infoLine, { color: colors.textSecondary }]}>
              {gameInfo.status?.long ?? gameInfo.status?.short ?? ''}
            </Text>
            <Text style={[styles.infoLine, { color: colors.textSecondary }]}>
              {gameInfo.date
                ? new Date(gameInfo.date).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Carregando estatísticas...</Text>
              </View>
            ) : error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : (
              <>
                {/* Estatísticas principais */}
                {statistics && (statistics.shots || statistics.powerplays || statistics.penalties) ? (
                  <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Estatísticas</Text>
                    {statistics.shots && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Chutes a gol</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {statistics.shots.home} - {statistics.shots.away}
                        </Text>
                      </View>
                    )}
                    {statistics.powerplays && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Power plays</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {statistics.powerplays.home} - {statistics.powerplays.away}
                        </Text>
                      </View>
                    )}
                    {statistics.penalties && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Penalidades</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {statistics.penalties.home} - {statistics.penalties.away}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Placeholder para mais detalhes como penalties listados, etc. */}
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
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    paddingBottom: spacing.lg,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: spacing.xs,
    resizeMode: 'contain',
  },
  teamName: {
    ...typography.caption,
    textAlign: 'center',
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  score: {
    ...typography.title,
  },
  scoreSep: {
    ...typography.subtitle,
  },
  infoLine: {
    ...typography.caption,
    textAlign: 'center',
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
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
  },
  cardTitle: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.caption,
    fontWeight: '600',
  },
});

