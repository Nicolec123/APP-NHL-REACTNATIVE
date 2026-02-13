import { API_BASE_URL } from '../config';

const HOCKEY_BASE = `${API_BASE_URL}/api/hockey`;

export type OlympicGame = {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  status: { short: string; long: string };
  league: { id: number; name: string };
  country: { id: number; name: string };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  scores?: {
    home: number | null;
    away: number | null;
  };
};

export type OlympicTeam = {
  id: number;
  name: string;
  logo?: string;
  country?: { id: number; name: string };
};

/** Detalhes profissionais da partida (períodos, stats, eventos, destaques). */
export type OlympicGameDetailsData = {
  matchId: number;
  arena?: string;
  city?: string;
  periods?: Array<{ home: number; away: number }>;
  stats?: {
    shots?: { home: number; away: number };
    penalties?: { home: number; away: number };
    powerPlay?: { home: string; away: string };
    faceoffs?: { home: number; away: number };
  };
  events?: Array<{
    period?: number;
    time: string;
    team: 'home' | 'away';
    type: 'goal' | 'penalty' | string;
    player?: string;
    detail?: string;
  }>;
  stars?: string[];
  scores?: { home: number; away: number };
};

type ApiResponse<T> = {
  response?: T;
  message?: string;
};

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(HOCKEY_BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).message ?? 'Erro na API Hockey';
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchOlympicGames(season?: string): Promise<OlympicGame[]> {
  // Olimpíadas de Inverno 2026 (Milano Cortina)
  const params = { season: season ?? '2026' };
  const data = await get<ApiResponse<OlympicGame[]>>('/olympics/games', params);
  return data.response ?? [];
}

export async function fetchOlympicTeams(season?: string): Promise<OlympicTeam[]> {
  const params = season ? { season } : undefined;
  const data = await get<ApiResponse<OlympicTeam[]>>('/olympics/teams', params);
  const raw = data.response ?? [];
  return raw.map((t: any) => ({
    id: t.team?.id ?? t.id,
    name: t.team?.name ?? t.name ?? '—',
    logo: t.team?.logo ?? t.logo,
    country: t.country ?? t.team?.country,
  }));
}

export async function fetchOlympicLeagueId(): Promise<number | null> {
  const data = await get<{ olympicLeagueId: number | null }>('/olympics/leagues');
  return data.olympicLeagueId ?? null;
}

export async function fetchOlympicGameStats(gameId: number): Promise<OlympicGameDetailsData | null> {
  const data = await get<ApiResponse<OlympicGameDetailsData[]>>('/games/statistics', { game: String(gameId) });
  const response = data.response ?? [];
  if (Array.isArray(response) && response.length > 0) return response[0];
  return null;
}

