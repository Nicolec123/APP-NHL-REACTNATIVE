import { Router, Request } from 'express';
import axios from 'axios';

/**
 * Proxy para a NHL Stats API (oficial e gratuita)
 * https://statsapi.web.nhl.com
 * Evita CORS e centraliza chamadas no backend.
 */
const NHL_BASE_URL = 'https://statsapi.web.nhl.com/api/v1';

export const nhlProxyRoutes = Router();

async function nhlGet(path: string, params?: Record<string, string | number>) {
  const { data } = await axios.get(`${NHL_BASE_URL}${path}`, {
    params,
    timeout: 15000
  });
  return data;
}

// --- Calendário / Jogos ---
nhlProxyRoutes.get('/schedule/today', async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await nhlGet('/schedule', {
      date: today,
      expand: 'schedule.linescore'
    });
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar schedule da NHL', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar jogos da NHL agora.' });
  }
});

nhlProxyRoutes.get('/schedule', async (req: Request<{}, {}, {}, { date?: string }>, res) => {
  try {
    const date = req.query.date ?? new Date().toISOString().split('T')[0];
    const data = await nhlGet('/schedule', {
      date,
      expand: 'schedule.linescore'
    });
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar schedule', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar jogos.' });
  }
});

// --- Times ---
nhlProxyRoutes.get('/teams', async (_req, res) => {
  try {
    const data = await nhlGet('/teams', { expand: 'team.roster' });
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar times', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar times da NHL.' });
  }
});

// --- Classificação (standings) ---
nhlProxyRoutes.get('/standings', async (req: Request<{}, {}, {}, { season?: string }>, res) => {
  try {
    const season = req.query.season ?? new Date().getFullYear().toString();
    const data = await nhlGet('/standings', { season });
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar standings', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar classificação.' });
  }
});

// --- Jogo ao vivo / boxscore / play-by-play ---
nhlProxyRoutes.get('/game/:gameId/feed/live', async (req, res) => {
  try {
    const { gameId } = req.params;
    const data = await nhlGet(`/game/${gameId}/feed/live`);
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar feed do jogo', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar dados do jogo.' });
  }
});

// --- Jogador ---
nhlProxyRoutes.get('/people/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const data = await nhlGet(`/people/${playerId}`);
    return res.json(data);
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar jogador', error?.message);
    return res.status(500).json({ message: 'Não foi possível buscar jogador.' });
  }
});

