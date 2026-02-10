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

export async function fetchOlympicGames(season = '2022'): Promise<OlympicGame[]> {
  const data = await get<ApiResponse<OlympicGame[]>>('/olympics/games', { season });
  return data.response ?? [];
}

export async function fetchOlympicTeams(season = '2022'): Promise<OlympicTeam[]> {
  const data = await get<ApiResponse<OlympicTeam[]>>('/olympics/teams', { season });
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
