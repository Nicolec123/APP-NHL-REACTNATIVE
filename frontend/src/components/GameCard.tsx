import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, radius } from '../theme';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'LIVE' | 'FINAL' | 'UPCOMING';
  league?: string;
};

const statusLabel: Record<Props['status'], string> = {
  LIVE: 'Ao vivo',
  FINAL: 'Final',
  UPCOMING: 'Próximo jogo',
};

export const GameCard: React.FC<Props> = ({
  homeTeam,
  awayTeam,
  startTime,
  status,
  league = 'NHL',
}) => {
  const colors = useThemeColors();
  const statusColor =
    status === 'LIVE'
      ? colors.accent
      : status === 'FINAL'
        ? colors.textSecondary
        : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      {status === 'LIVE' && <View style={[styles.liveBar, { backgroundColor: colors.accent }]} />}
      <View style={styles.header}>
        <Text style={[styles.league, { color: colors.textSecondary }]}>{league}</Text>
        <View style={[styles.statusPill, { backgroundColor: status === 'LIVE' ? colors.accentSoft : undefined }]}>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel[status]}</Text>
        </View>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.team}>
          <Text style={[styles.teamCode, { color: colors.text }]}>{awayTeam}</Text>
        </View>
        <Text style={[styles.vs, { color: colors.textSecondary }]}>@</Text>
        <View style={styles.team}>
          <Text style={[styles.teamCode, { color: colors.text }]}>{homeTeam}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>{startTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  liveBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  league: {
    ...typography.overline,
    letterSpacing: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  status: {
    ...typography.caption,
    fontWeight: '600',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamCode: {
    ...typography.subtitle,
    letterSpacing: 0.5,
  },
  vs: {
    ...typography.caption,
    paddingHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  time: {
    ...typography.caption,
  },
});
