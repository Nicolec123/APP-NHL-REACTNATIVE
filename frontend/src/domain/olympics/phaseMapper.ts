export type OlympicGender = 'male' | 'female';

export type OlympicStatus = 'live' | 'scheduled' | 'finished';

export type OlympicGameNormalized = {
  id: number;
  home: { id?: number; name: string; logo?: string };
  away: { id?: number; name: string; logo?: string };
  dateLabel: string;
  timeLabel: string;
  timestamp?: number;
  phase: string;
  rawPhase?: string;
  status: OlympicStatus;
  scores: { home?: number | null; away?: number | null };
  leagueName?: string;
  gender: OlympicGender;
};

export function mapRoundToPhaseLabel(round?: string): string {
  if (!round) return 'Fase do torneio';
  const key = round.toLowerCase();
  if (key.includes('preliminary') || key.includes('group')) return 'Fase preliminar';
  if (key.includes('qualification') || key.includes('qualifying')) return 'Eliminatórias';
  if (key.includes('quarter')) return 'Quartas de final';
  if (key.includes('semi')) return 'Semifinal';
  if (key.includes('bronze')) return 'Disputa de bronze';
  if (key.includes('gold') || key.includes('final')) return 'Final';
  return round;
}

/** Normaliza 1 jogo vindo da API-Sports Hockey para um modelo único usado em todo o app. */
export function normalizeOlympicGame(raw: any): OlympicGameNormalized | null {
  if (!raw) return null;
  const game = raw.game ?? raw;
  const teams = raw.teams ?? game.teams ?? {};
  const home = teams.home ?? {};
  const away = teams.away ?? {};
  const scores = raw.scores ?? game.scores ?? {};

  const statusShort = (game.status?.short ?? raw.status?.short ?? '').toUpperCase();
  const isLive = statusShort === 'LIVE' || statusShort === '1H' || statusShort === '2H' || statusShort === '3H';
  const isFinal =
    statusShort === 'FT' || statusShort === 'AOT' || statusShort === 'AWD' || statusShort === 'WO' || statusShort === 'FIN';
  let status: OlympicStatus = 'scheduled';
  if (isLive) status = 'live';
  else if (isFinal) status = 'finished';

  const rawDate = (game.date ?? raw.date ?? '') as string;
  const rawTime = (game.time ?? raw.time ?? '') as string;

  let dateLabel = '';
  let timeLabel = '';
  let timestamp: number | undefined;

  const rawTimestamp = typeof game.timestamp === 'number' ? game.timestamp : raw.timestamp;

  if (rawDate) {
    const [datePart, timePartWithZone] = rawDate.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    if (year && month && day) {
      const baseDate = new Date(year, month - 1, day);
      dateLabel = baseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      timestamp = baseDate.getTime();
    }

    const timeSource = rawTime || timePartWithZone?.slice(0, 5);
    if (timeSource) {
      const [hh, mm] = timeSource.split(':').map(Number);
      if (!Number.isNaN(hh)) {
        const baseTime = new Date(1970, 0, 1, hh, mm || 0);
        timeLabel = baseTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (timestamp) {
          const dateObj = new Date(timestamp);
          dateObj.setHours(hh, mm || 0, 0, 0);
          timestamp = dateObj.getTime();
        }
      }
    }
  }

  if (!timestamp && typeof rawTimestamp === 'number') {
    timestamp = rawTimestamp * 1000;
  }

  const leagueName = String(game.league?.name ?? raw.league?.name ?? '').toLowerCase();
  const homeNameLower = String(home.name ?? '').toLowerCase();
  const awayNameLower = String(away.name ?? '').toLowerCase();
  const isWomenLeague =
    leagueName.includes('women') ||
    leagueName.includes('femin') ||
    homeNameLower.includes('women') ||
    awayNameLower.includes('women');
  const gender: OlympicGender = isWomenLeague ? 'female' : 'male';

  const rawPhase =
    game.round?.name ??
    game.round ??
    raw.round?.name ??
    raw.round ??
    game.stage?.name ??
    raw.stage?.name ??
    '';
  const phase = mapRoundToPhaseLabel(rawPhase);

  return {
    id: game.id ?? raw.id ?? 0,
    home: {
      id: home.id ?? game.home?.id,
      name: home.name ?? game.home?.name ?? 'TBD',
      logo: home.logo ?? game.home?.logo,
    },
    away: {
      id: away.id ?? game.away?.id,
      name: away.name ?? game.away?.name ?? 'TBD',
      logo: away.logo ?? game.away?.logo,
    },
    dateLabel,
    timeLabel,
    timestamp,
    phase,
    rawPhase,
    status,
    scores: {
      home: scores.home ?? game.scores?.home,
      away: scores.away ?? game.scores?.away,
    },
    leagueName: game.league?.name ?? raw.league?.name,
    gender,
  };
}

export function normalizeOlympicGames(list: any[] | undefined | null): OlympicGameNormalized[] {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeOlympicGame)
    .filter((g): g is OlympicGameNormalized => g != null)
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
}

