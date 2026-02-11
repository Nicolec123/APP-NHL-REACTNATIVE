import { Router, Request } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * Proxy para API-Sports Hockey (hockey internacional + Olimpíadas).
 * https://api-sports.io/sports/hockey
 * Requer APISPORTS_HOCKEY_KEY no .env.
 */
const HOCKEY_API_BASE = 'https://v1.hockey.api-sports.io';

export const hockeyApiRoutes = Router();

function getHeaders() {
  const key = config.apiSportsHockeyKey;
  if (!key) throw new Error('APISPORTS_HOCKEY_KEY não configurada');
  return { 'x-apisports-key': key };
}

// Cache simples em memória (por liga/temporada) para reduzir chamadas à API externa
type CacheEntry = { data: any; timestamp: number };
const GAMES_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minuto – pode ajustar depois se quiser

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

// Estatísticas de um jogo
hockeyApiRoutes.get('/games/statistics', async (req: Request<{}, {}, {}, { game?: string }>, res) => {
  try {
    const game = req.query.game;
    if (!game) return res.status(400).json({ message: 'Parâmetro game é obrigatório.' });
    const { data } = await axios.get(`${HOCKEY_API_BASE}/games/statistics`, {
      params: { game },
      headers: getHeaders(),
      timeout: 12000
    });
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey game statistics', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar estatísticas.' });
  }
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
  try {
    const leagueId = await getOlympicLeagueId();
    if (leagueId == null) {
      return res.json({ response: [], message: 'Liga olímpica não encontrada na API.' });
    }
    const season = req.query.season ?? '2022';
    const cacheKey = `olympics:games:${leagueId}:${season}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await axios.get(`${HOCKEY_API_BASE}/games`, {
      params: { league: leagueId, season },
      headers: getHeaders(),
      timeout: 12000
    });
    setCache(cacheKey, data);
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey olympics games', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar jogos olímpicos.' });
  }
});

hockeyApiRoutes.get('/olympics/teams', async (req: Request<{}, {}, {}, { season?: string }>, res) => {
  try {
    const leagueId = await getOlympicLeagueId();
    if (leagueId == null) {
      return res.json({ response: [], message: 'Liga olímpica não encontrada na API.' });
    }
    const season = req.query.season ?? '2022';
    const { data } = await axios.get(`${HOCKEY_API_BASE}/teams`, {
      params: { league: leagueId, season },
      headers: getHeaders(),
      timeout: 12000
    });
    return res.json(data);
  } catch (error: any) {
    if (error.message?.includes('não configurada')) {
      return res.status(503).json({ message: 'API Hockey não configurada.' });
    }
    console.error('[IceHub API] Erro Hockey olympics teams', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar times olímpicos.' });
  }
});
