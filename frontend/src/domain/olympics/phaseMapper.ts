export type OlympicGender = 'male' | 'female';

export type OlympicStatus = 'live' | 'scheduled' | 'finished';

/** Chave de fase para agrupamento (Bracket View – Central da competição) */
export type PhaseKey = 'group' | 'quarterfinal' | 'semifinal' | 'bronze' | 'final' | 'other';

export type OlympicGameNormalized = {
  id: number;
  home: { id?: number; name: string; logo?: string };
  away: { id?: number; name: string; logo?: string };
  dateLabel: string;
  timeLabel: string;
  timestamp?: number;
  /** Label para exibição (ex.: "Fase preliminar", "Quartas de final") */
  phase: string;
  /** Chave para agrupar por fase (group, quarterfinal, semifinal, final, etc.) */
  phaseKey: PhaseKey;
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

/**
 * Mapeia o texto bruto da fase (round/stage) para uma chave fixa.
 * Usado para agrupar jogos na Central da competição (Bracket View).
 */
export function mapPhase(rawPhase: string | undefined): PhaseKey {
  const text = (rawPhase ?? '').toLowerCase();
  if (text.includes('quarter')) return 'quarterfinal';
  if (text.includes('semi')) return 'semifinal';
  if (text.includes('bronze')) return 'bronze';
  if (text.includes('gold') || text.includes('final')) return 'final';
  if (text.includes('group') || text.includes('preliminary') || text.includes('qualification') || text.includes('qualifying')) return 'group';
  return 'other';
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

  const rawTimestamp = typeof game.timestamp === 'number' ? game.timestamp : raw.timestamp;

  let dateLabel = '';
  let timeLabel = '';
  let timestamp: number | undefined;

  // 1) Se a API já fornecer um timestamp numérico, usamos ele como
  // fonte da verdade para data/hora, garantindo comparação correta com "agora".
  // A API-Sports costuma mandar segundos Unix; se vier em ms, detectamos pelo tamanho.
  if (typeof rawTimestamp === 'number') {
    const tsMs = rawTimestamp < 2_000_000_000 ? rawTimestamp * 1000 : rawTimestamp;
    const dateObj = new Date(tsMs);
    timestamp = tsMs;
    dateLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    timeLabel = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (rawDate) {
    // 2) Fallback: monta a data/hora a partir de strings `date` e `time`
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

  const leagueName = String(game.league?.name ?? raw.league?.name ?? '').toLowerCase();
  const homeNameLower = String(home.name ?? '').toLowerCase();
  const awayNameLower = String(away.name ?? '').toLowerCase();

  // Heurística mais abrangente para identificar competições femininas
  const womenHints = ['women', 'woman', 'womens', 'female', 'ladies', 'femin'];
  const hasWomenHint =
    womenHints.some(h => leagueName.includes(h)) ||
    womenHints.some(h => homeNameLower.includes(h)) ||
    womenHints.some(h => awayNameLower.includes(h)) ||
    /\b(w|women)\b/.test(homeNameLower) ||
    /\b(w|women)\b/.test(awayNameLower);

  const isWomenLeague = hasWomenHint;
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
  const phaseKey = mapPhase(rawPhase);

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
    phaseKey,
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

/** Ordem lógica das fases (Bracket View – Game Day e Concluídos) */
export const PHASE_ORDER: PhaseKey[] = ['group', 'quarterfinal', 'semifinal', 'bronze', 'final', 'other'];

/** Títulos por fase para exibição */
export const PHASE_TITLES: Record<PhaseKey, string> = {
  group: 'Fase de Grupos',
  quarterfinal: 'Quartas de Final',
  semifinal: 'Semifinais',
  bronze: 'Disputa de Bronze',
  final: 'Final',
  other: 'Outras fases',
};

/** Nomes dos ícones Ionicons por fase (people, flame, flash, medal, trophy, list) */
export const PHASE_ICONS: Record<PhaseKey, string> = {
  group: 'people',
  quarterfinal: 'flame',
  semifinal: 'flash',
  bronze: 'medal',
  final: 'trophy',
  other: 'list',
};

/** Agrupa jogos por phaseKey. */
export function groupByPhase(games: OlympicGameNormalized[]): Record<PhaseKey, OlympicGameNormalized[]> {
  const acc = {} as Record<PhaseKey, OlympicGameNormalized[]>;
  PHASE_ORDER.forEach(key => { acc[key] = []; });
  games.forEach(game => {
    const key = game.phaseKey ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
  });
  return acc;
}

