import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { IceBackground } from '@components/IceBackground';
import { ScreenHeader } from '@components/ScreenHeader';
import { GameCard } from '@components/GameCard';
import { Skeleton } from '@components/Skeleton';
import { useThemeColors } from '@hooks/useThemeColors';
import { useAppStore } from '@store/useAppStore';
import { fetchOlympicGames } from '@services/hockeyApi';
import { spacing, typography } from '../theme';

type OlympicGameItem = {
  id: number;
  homeName: string;
  awayName: string;
  date: string;
  time: string;
  status: 'LIVE' | 'FINAL' | 'UPCOMING';
};

function normalizeOlympicGames(data: any[]): OlympicGameItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((g: any) => {
    const game = g.game ?? g;
    const teams = g.teams ?? game.teams ?? {};
    const home = teams.home ?? {};
    const away = teams.away ?? {};
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
    };
  });
}

export const GameDayScreen: React.FC = () => {
  const colors = useThemeColors();
  const mode = useAppStore(state => state.mode);
  const [olympicGames, setOlympicGames] = useState<OlympicGameItem[]>([]);
  const [loading, setLoading] = useState(false);

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
        )}
      </ScrollView>
    </IceBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
