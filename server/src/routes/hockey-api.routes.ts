import { Router, Request } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { config } from '../config';

/**
 * Proxy para API-Sports Hockey (hockey internacional + Olimpíadas).
 * Se APISPORTS_HOCKEY_KEY não estiver definida, usa TheSportsDB (gratuita) para jogos e times olímpicos.
 */
const HOCKEY_API_BASE = 'https://v1.hockey.api-sports.io';
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json';
const OLYMPICS_ICE_HOCKEY_LEAGUE_ID = 5137; // TheSportsDB – Olimpíadas de Inverno 2026

export const hockeyApiRoutes = Router();

function getHeaders() {
  const key = config.apiSportsHockeyKey;
  if (!key) throw new Error('APISPORTS_HOCKEY_KEY não configurada');
  return { 'x-apisports-key': key };
}

function useOlympicsFromSportsDb(): boolean {
  return !config.apiSportsHockeyKey || config.apiSportsHockeyKey.length === 0;
}

/** Converte evento TheSportsDB para o formato esperado pelo frontend (compatível com phaseMapper). */
function mapSportsDbEventToGame(e: any): any {
  const ts = e.strTimestamp ? new Date(e.strTimestamp).getTime() : undefined;
  return {
    id: parseInt(String(e.idEvent), 10) || 0,
    date: e.dateEvent ?? '',
    time: e.strTime ? String(e.strTime).slice(0, 5) : '',
    timestamp: ts,
    status: { short: e.strStatus || 'NS' },
    league: { name: e.strLeague || 'Olympics Ice Hockey' },
    teams: {
      home: {
        id: e.idHomeTeam ? parseInt(String(e.idHomeTeam), 10) : undefined,
        name: e.strHomeTeam ?? 'TBD',
        logo: e.strHomeTeamBadge || undefined
      },
      away: {
        id: e.idAwayTeam ? parseInt(String(e.idAwayTeam), 10) : undefined,
        name: e.strAwayTeam ?? 'TBD',
        logo: e.strAwayTeamBadge || undefined
      }
    },
    scores: {
      home: e.intHomeScore != null && e.intHomeScore !== '' ? parseInt(String(e.intHomeScore), 10) : null,
      away: e.intAwayScore != null && e.intAwayScore !== '' ? parseInt(String(e.intAwayScore), 10) : null
    },
    round: e.strGroup ? `Group ${e.strGroup}` : (e.intRound ? `Round ${e.intRound}` : undefined)
  };
}

/** Busca jogos olímpicos na TheSportsDB (Olimpíadas 2026 – sem precisar de APISPORTS_HOCKEY_KEY). */
async function fetchOlympicGamesFromSportsDb(): Promise<any[]> {
  const key = config.theSportsDbApiKey || '123';
  const [nextRes, pastRes] = await Promise.all([
    axios.get(`${THESPORTSDB_BASE}/${key}/eventsnextleague.php`, { params: { id: OLYMPICS_ICE_HOCKEY_LEAGUE_ID }, timeout: 10000 }),
    axios.get(`${THESPORTSDB_BASE}/${key}/eventspastleague.php`, { params: { id: OLYMPICS_ICE_HOCKEY_LEAGUE_ID }, timeout: 10000 })
  ]);
  const nextEvents = nextRes.data?.events ?? [];
  const pastEvents = pastRes.data?.events ?? [];
  const all = [...pastEvents, ...nextEvents];
  return all.map(mapSportsDbEventToGame);
}

/** Extrai lista única de times a partir dos jogos (para /olympics/teams via TheSportsDB). */
async function fetchOlympicTeamsFromSportsDb(): Promise<any[]> {
  const games = await fetchOlympicGamesFromSportsDb();
  const byId = new Map<number, { id: number; name: string; logo?: string }>();
  for (const g of games) {
    const home = g.teams?.home;
    const away = g.teams?.away;
    if (home?.id && home?.name) byId.set(home.id, { id: home.id, name: home.name, logo: home.logo });
    if (away?.id && away?.name) byId.set(away.id, { id: away.id, name: away.name, logo: away.logo });
  }
  return Array.from(byId.values());
}

/** ETAPA 1 – Mock de jogos olímpicos 2026 (formato compatível com phaseMapper). Inclui logos. */
function getMockOlympicGames(): any[] {
  const base = (id: number, home: string, away: string, dateStr: string, timeStr: string, phase = 'Group A') => {
    const d = new Date(dateStr);
    return {
      id: 9000000 + id,
      date: dateStr.slice(0, 10),
      time: timeStr,
      timestamp: d.getTime(),
      status: { short: 'NS' },
      league: { name: 'Olympics Ice Hockey' },
      teams: {
        home: { id: id * 2, name: home, logo: getOlympicTeamLogo(home) },
        away: { id: id * 2 + 1, name: away, logo: getOlympicTeamLogo(away) },
      },
      scores: { home: null, away: null },
      round: phase
    };
  };
  return [
    base(1, 'Canada', 'USA', '2026-02-14', '19:00:00'),
    base(2, 'Finland', 'Sweden', '2026-02-15', '21:00:00'),
    base(3, 'Czech Republic', 'Slovakia', '2026-02-16', '14:00:00'),
    base(4, 'Germany', 'Switzerland', '2026-02-17', '16:00:00')
  ];
}

/** ETAPA 2 – Lista fixa de seleções olímpicas (fallback quando APIs não retornam). */
function getMockOlympicTeams(): any[] {
  const names = [
    'Canada', 'USA', 'Sweden', 'Finland', 'Czech Republic', 'Russia', 'Germany',
    'Switzerland', 'Slovakia', 'Italy', 'Latvia', 'Norway'
  ];
  return names.map((name, i) => ({
    id: 8000000 + i + 1,
    name: name + ' Ice Hockey',
    logo: undefined
  }));
}

/** Busca jogos na API-Sports (requer chave). Retorna [] em erro ou sem dados. */
async function fetchFromApiSports(season: string): Promise<any[]> {
  if (!config.apiSportsHockeyKey) return [];
  try {
    const leagueId = await getOlympicLeagueId();
    if (leagueId == null) return [];
    const { data } = await axios.get(`${HOCKEY_API_BASE}/games`, {
      params: { league: leagueId, season },
      headers: getHeaders(),
      timeout: 12000
    });
    const list = data?.response ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Códigos de país para logos (flagcdn). Usado quando o JSON não traz homeLogo/awayLogo. */
const OLYMPIC_TEAM_LOGOS: Record<string, string> = {
  canada: 'https://flagcdn.com/w80/ca.png',
  usa: 'https://flagcdn.com/w80/us.png',
  sweden: 'https://flagcdn.com/w80/se.png',
  finland: 'https://flagcdn.com/w80/fi.png',
  germany: 'https://flagcdn.com/w80/de.png',
  switzerland: 'https://flagcdn.com/w80/ch.png',
  slovakia: 'https://flagcdn.com/w80/sk.png',
  'czech republic': 'https://flagcdn.com/w80/cz.png',
  italy: 'https://flagcdn.com/w80/it.png',
  latvia: 'https://flagcdn.com/w80/lv.png',
  norway: 'https://flagcdn.com/w80/no.png',
  russia: 'https://flagcdn.com/w80/ru.png',
  tbd: '',
};

function getOlympicTeamLogo(teamName: string | undefined): string | undefined {
  if (!teamName || teamName === 'TBD') return undefined;
  const key = String(teamName).toLowerCase().replace(/\s+ice hockey$/i, '').trim();
  const url = OLYMPIC_TEAM_LOGOS[key];
  return url || undefined;
}

/** Converte item do JSON remoto (olympics20XX.json) para o formato esperado pelo frontend (phaseMapper). Inclui logos. */
function mapRemoteJsonToGame(item: any): any {
  const dateStr = item.date ?? '';
  const timeStr = item.time ?? '18:00';
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = String(timeStr).split(':').map((x: string) => parseInt(x, 10) || 0);
  const timestamp = y && m && d ? new Date(y, m - 1, d, hh, mm, 0).getTime() : undefined;
  const statusShort = item.status === 'FINAL' ? 'FT' : item.status === 'LIVE' ? 'LIVE' : 'NS';
  const score = item.score ?? {};
  const homeName = item.home ?? 'TBD';
  const awayName = item.away ?? 'TBD';
  return {
    id: item.id ?? 0,
    date: dateStr,
    time: timeStr.length <= 5 ? timeStr : timeStr.slice(0, 5),
    timestamp,
    status: { short: statusShort },
    league: { name: 'Olympics Ice Hockey' },
    teams: {
      home: {
        name: homeName,
        logo: item.homeLogo ?? getOlympicTeamLogo(homeName),
      },
      away: {
        name: awayName,
        logo: item.awayLogo ?? getOlympicTeamLogo(awayName),
      },
    },
    scores: {
      home: score.home != null ? score.home : null,
      away: score.away != null ? score.away : null
    },
    round: item.phase ?? 'Group A'
  };
}

/** Busca jogos do JSON remoto ou arquivo local para uma temporada (ex.: 2026, 2022, 2018). */
async function fetchRemoteOlympics(season: string): Promise<any[]> {
  const year = season || '2026';
  if (year === '2026' && config.remoteOlympicsJsonUrl) {
    try {
      const res = await axios.get(config.remoteOlympicsJsonUrl, { timeout: 8000 });
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        console.log('[IceHub API] Jogos olímpicos do JSON remoto:', list.length);
        return list.map(mapRemoteJsonToGame);
      }
    } catch (err: any) {
      console.warn('[IceHub API] Erro JSON remoto:', err?.message ?? err);
    }
  }
  const localPath = path.join(__dirname, `../../data/olympics${year}.json`);
  try {
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        console.log('[IceHub API] Jogos olímpicos', year, 'do arquivo local:', list.length);
        return list.map(mapRemoteJsonToGame);
      }
    }
  } catch (err: any) {
    console.warn('[IceHub API] Erro ao ler olympics' + year + '.json:', (err as Error)?.message);
  }
  return [];
}

/** Mock por ano (concluídos): jogos genéricos com logos. */
function getMockOlympicGamesForYear(season: string): any[] {
  const y = season === '2022' ? '2022' : season === '2018' ? '2018' : season;
  const base = (id: number, home: string, away: string, dateStr: string, timeStr: string, phase: string, status: string, sh?: number, sa?: number) => ({
    id: 9000000 + id + (y === '2022' ? 100 : y === '2018' ? 200 : 0),
    date: dateStr,
    time: timeStr,
    timestamp: new Date(dateStr + 'T' + timeStr).getTime(),
    status: { short: status === 'FINAL' ? 'FT' : 'NS' },
    league: { name: 'Olympics Ice Hockey' },
    teams: {
      home: { name: home, logo: getOlympicTeamLogo(home) },
      away: { name: away, logo: getOlympicTeamLogo(away) },
    },
    scores: { home: sh ?? null, away: sa ?? null },
    round: phase,
  });
  return [
    base(1, 'Canada', 'USA', `${y}-02-12`, '18:00', 'Group A', 'FINAL', 4, 2),
    base(2, 'Sweden', 'Finland', `${y}-02-12`, '21:00', 'Group A', 'FINAL', 3, 1),
    base(3, 'Russia', 'Czech Republic', `${y}-02-13`, '18:00', 'Group B', 'FINAL', 2, 3),
    base(4, 'Canada', 'Finland', `${y}-02-18`, '20:00', 'Semifinal', 'FINAL', 2, 0),
    base(5, 'Russia', 'Sweden', `${y}-02-19`, '20:00', 'Final', 'FINAL', 2, 1),
  ];
}

/** Cadeia de fallback por temporada. Para 2026: JSON → API → SportsDB → mock. Para 2022/2018: JSON local → API → mock. */
async function fetchOlympicGamesWithFallbacks(season: string): Promise<any[]> {
  const year = season || '2026';
  let games: any[] = await fetchRemoteOlympics(year);

  if (games.length === 0 && config.apiSportsHockeyKey) {
    games = await fetchFromApiSports(year);
  }

  if (games.length === 0 && year === '2026') {
    try {
      games = await fetchOlympicGamesFromSportsDb();
    } catch {
      games = [];
    }
  }

  if (games.length === 0) {
    games = year === '2026' ? getMockOlympicGames() : getMockOlympicGamesForYear(year);
    if (games.length > 0) {
      console.log('[IceHub API] Fallback → mock', year);
    }
  }

  return games;
}

// Cache em memória (ETAPA 6) – reduz chamadas em ~90%
type CacheEntry = { data: any; timestamp: number };
const GAMES_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minuto

function getCache(key: string): any | null {
  const entry = GAMES_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    GAMES_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  GAMES_CACHE.set(key, { data, timestamp: Date.now() });
}

// Listar ligas (para achar Olympics e pegar ID)
hockeyApiRoutes.get('/leagues', async (_req, res) => {
  try {
    const { data } = await axios.get(`${HOCKEY_API_BASE}/leagues`, {
      headers: getHeaders(),
      timeout: 12000
    });
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada. Defina APISPORTS_HOCKEY_KEY.' });
    }
    console.error('[IceHub API] Erro Hockey leagues', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar ligas.' });
  }
});

// Jogos por liga e temporada (ex.: Olimpíadas)
hockeyApiRoutes.get('/games', async (req: Request<{}, {}, {}, { league?: string; season?: string }>, res) => {
  try {
    const league = req.query.league ?? '';
    const season = req.query.season ?? '2022';
    const cacheKey = `games:${league}:${season}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await axios.get(`${HOCKEY_API_BASE}/games`, {
      params: { league, season },
      headers: getHeaders(),
      timeout: 12000
    });
    setCache(cacheKey, data);
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey games', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar jogos.' });
  }
});

/** Gera detalhes simulados de partida (formato profissional) quando API não está disponível. */
function getMockGameDetails(gameId: number): any {
  const id = Math.abs(gameId);
  const seed = id % 1000;
  const arenas = ['Milano Ice Arena', 'Arena Rink A', 'Palazzo del Ghiaccio', 'PalaItalia'];
  const cities = ['Milano', 'Cortina', 'Milano', 'Milano'];
  const arenaIndex = (seed >> 2) % arenas.length;
  const p1 = { home: (seed % 3) + 1, away: (seed % 2) };
  const p2 = { home: ((seed >> 1) % 2) + 1, away: (seed >> 2) % 2 };
  const p3 = { home: ((seed >> 3) % 2) + 1, away: (seed >> 4) % 2 };
  const periods = [p1, p2, p3];
  const totalHome = p1.home + p2.home + p3.home;
  const totalAway = p1.away + p2.away + p3.away;
  const shotsHome = 28 + (seed % 15);
  const shotsAway = 18 + ((seed >> 1) % 12);
  const penaltiesHome = 4 + (seed % 5);
  const penaltiesAway = 3 + ((seed >> 2) % 6);
  const ppHome = `${(seed % 3)}/${Math.min(5, 3 + (seed % 3))}`;
  const ppAway = `${(seed >> 1) % 2}/${2 + (seed % 2)}`;
  const faceHome = 20 + (seed % 15);
  const faceAway = 18 + ((seed >> 2) % 12);
  const players = ['McDavid', 'Crosby', 'Draisaitl', 'Matthews', 'Reichel', 'Stützle', 'Pastrnak', 'Kaprizov'];
  const penalties = ['Hooking', 'Tripping', 'High Sticking', 'Interference', 'Slashing'];
  const events = [
    { period: 1, time: '05:21', team: 'home' as const, type: 'goal' as const, player: players[seed % players.length] },
    { period: 1, time: '12:10', team: 'away' as const, type: 'penalty' as const, detail: penalties[seed % penalties.length] },
    { period: 2, time: '08:44', team: 'away' as const, type: 'goal' as const, player: players[(seed + 1) % players.length] },
    { period: 2, time: '15:02', team: 'home' as const, type: 'goal' as const, player: players[(seed + 2) % players.length] },
    { period: 3, time: '03:18', team: 'home' as const, type: 'goal' as const, player: players[(seed + 3) % players.length] },
  ].slice(0, 3 + (seed % 3));
  const stars = [
    `${players[seed % players.length]} – 2 gols`,
    `${players[(seed + 1) % players.length]} – 1 gol + 1 assistência`,
    'Goleiro – 92% defesas',
  ];
  return {
    matchId: gameId,
    arena: arenas[arenaIndex],
    city: cities[arenaIndex],
    periods,
    stats: {
      shots: { home: shotsHome, away: shotsAway },
      penalties: { home: penaltiesHome, away: penaltiesAway },
      powerPlay: { home: ppHome, away: ppAway },
      faceoffs: { home: faceHome, away: faceAway },
    },
    events,
    stars,
    scores: { home: totalHome, away: totalAway },
  };
}

/** Normaliza resposta da API-Sports para o formato profissional (se possível). */
function normalizeApiSportsStats(data: any, gameId: number): any {
  const first = Array.isArray(data?.response) ? data.response[0] : data?.response ?? data;
  if (!first) return null;
  const game = first.game ?? first;
  const teams = first.teams ?? {};
  const periods = first.periods ?? first.scores?.periods;
  const stats = first.statistics ?? first.stats ?? {};
  const buildPeriods = () => {
    if (Array.isArray(periods) && periods.length >= 3) {
      return periods.slice(0, 3).map((p: any) => ({
        home: p.home ?? 0,
        away: p.away ?? 0,
      }));
    }
    const home = teams.home?.goals ?? game.goals?.home ?? 0;
    const away = teams.away?.goals ?? game.goals?.away ?? 0;
    return [
      { home: Math.floor(home / 3), away: Math.floor(away / 3) },
      { home: Math.floor(home / 3), away: Math.floor(away / 3) },
      { home: home - 2 * Math.floor(home / 3), away: away - 2 * Math.floor(away / 3) },
    ];
  };
  return {
    matchId: gameId,
    arena: game.venue?.name ?? game.arena ?? 'Arena',
    city: game.venue?.city ?? game.city ?? '',
    periods: buildPeriods(),
    stats: {
      shots: stats.shots ?? { home: 0, away: 0 },
      penalties: stats.penalties ?? { home: 0, away: 0 },
      powerPlay: stats.powerPlay ?? { home: '0/0', away: '0/0' },
      faceoffs: stats.faceoffs ?? { home: 0, away: 0 },
    },
    events: first.events ?? [],
    stars: first.stars ?? [],
    scores: { home: teams.home?.goals ?? game.goals?.home, away: teams.away?.goals ?? game.goals?.away },
  };
}

// Estatísticas de um jogo (formato profissional: períodos, stats, eventos, destaques). Fallback com dados simulados quando API não disponível.
hockeyApiRoutes.get('/games/statistics', async (req: Request<{}, {}, {}, { game?: string }>, res) => {
  const game = req.query.game;
  if (!game) return res.status(400).json({ message: 'Parâmetro game é obrigatório.' });
  const gameId = parseInt(String(game), 10) || 0;

  if (config.apiSportsHockeyKey) {
    try {
      const { data } = await axios.get(`${HOCKEY_API_BASE}/games/statistics`, {
        params: { game },
        headers: getHeaders(),
        timeout: 12000
      });
      const normalized = normalizeApiSportsStats(data, gameId);
      if (normalized) return res.json({ response: [normalized] });
    } catch (err: any) {
      console.warn('[IceHub API] Game statistics API failed, using mock:', err?.message);
    }
  }

  const mock = getMockGameDetails(gameId);
  return res.json({ response: [mock] });
});

// Times (por liga) – seleções olímpicas
hockeyApiRoutes.get('/teams', async (req: Request<{}, {}, {}, { league?: string; season?: string }>, res) => {
  try {
    const league = req.query.league ?? '';
    const season = req.query.season ?? '2022';
    const { data } = await axios.get(`${HOCKEY_API_BASE}/teams`, {
      params: { league, season },
      headers: getHeaders(),
      timeout: 12000
    });
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey teams', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar times.' });
  }
});

// Standings por liga/temporada (se a API tiver)
hockeyApiRoutes.get('/standings', async (req: Request<{}, {}, {}, { league?: string; season?: string }>, res) => {
  try {
    const league = req.query.league ?? '';
    const season = req.query.season ?? '2022';
    const { data } = await axios.get(`${HOCKEY_API_BASE}/standings`, {
      params: { league, season },
      headers: getHeaders(),
      timeout: 12000
    });
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey standings', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar classificação.' });
  }
});

// --- Rotas de conveniência para Olimpíadas (detectam liga olímpica pelo nome) ---
let cachedOlympicLeagueId: number | null = null;

async function getOlympicLeagueId(): Promise<number | null> {
  if (cachedOlympicLeagueId != null) return cachedOlympicLeagueId;
  try {
    const { data } = await axios.get(`${HOCKEY_API_BASE}/leagues`, {
      headers: getHeaders(),
      timeout: 12000
    });
    const leagues = data?.response ?? [];
    const nameIncludesOlympic = (n: string) =>
      n && (String(n).toLowerCase().includes('olympic') || String(n).toLowerCase().includes('olympics'));
    const olympic = leagues.find(
      (l: any) => nameIncludesOlympic(l?.name) || nameIncludesOlympic(l?.league?.name)
    );
    const id = olympic?.league?.id ?? olympic?.id;
    if (id) {
      cachedOlympicLeagueId = id;
      return cachedOlympicLeagueId;
    }
    const byId = leagues.find((l: any) => l.league?.id === 76 || l.league?.id === 77 || l.id === 76 || l.id === 77);
    const fallbackId = byId?.league?.id ?? byId?.id;
    if (fallbackId) {
      cachedOlympicLeagueId = fallbackId;
      return cachedOlympicLeagueId;
    }
  } catch {
    // ignora
  }
  return null;
}

hockeyApiRoutes.get('/olympics/leagues', async (_req, res) => {
  try {
    if (useOlympicsFromSportsDb()) {
      return res.json({ olympicLeagueId: OLYMPICS_ICE_HOCKEY_LEAGUE_ID });
    }
    const id = await getOlympicLeagueId();
    return res.json({ olympicLeagueId: id });
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    return res.status(500).json({ message: 'Erro ao buscar liga olímpica.' });
  }
});

hockeyApiRoutes.get('/olympics/games', async (req: Request<{}, {}, {}, { season?: string }>, res) => {
  const season = req.query.season ?? '2026';
  try {
    const cacheKey = `olympics:games:${season}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const games = await fetchOlympicGamesWithFallbacks(season);
    const data = { response: games };
    setCache(cacheKey, data);
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro Hockey olympics games', error?.message);
    const fallback = { response: season === '2026' ? getMockOlympicGames() : getMockOlympicGamesForYear(season) };
    return res.json(fallback);
  }
});

hockeyApiRoutes.get('/olympics/teams', async (_req, res) => {
  try {
    let teams: any[] = [];

    if (config.apiSportsHockeyKey) {
      const leagueId = await getOlympicLeagueId().catch(() => null);
      if (leagueId != null) {
        for (const season of ['2026', '2022']) {
          try {
            const { data } = await axios.get(`${HOCKEY_API_BASE}/teams`, {
              params: { league: leagueId, season },
              headers: getHeaders(),
              timeout: 12000
            });
            teams = data?.response ?? [];
            if (teams.length > 0) break;
          } catch {
            teams = [];
          }
        }
      }
    }

    if (teams.length === 0) {
      try {
        teams = await fetchOlympicTeamsFromSportsDb();
      } catch {
        teams = [];
      }
    }

    if (teams.length === 0) {
      teams = getMockOlympicTeams();
    }

    return res.json({ response: teams });
  } catch (error: any) {
    console.error('[IceHub API] Erro Hockey olympics teams', error?.message);
    return res.json({ response: getMockOlympicTeams() });
  }
});
