import { API_BASE_URL } from '../config';

const NHL_API_BASE = `${API_BASE_URL}/api/nhl`;

type RequestParams = Record<string, string | number | boolean | undefined>;

async function get<TResponse>(path: string, params?: RequestParams): Promise<TResponse> {
  const url = new URL(NHL_API_BASE + path);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Erro na requisição para a API da NHL: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export const nhlApi = {
  get
};

export type NhlGame = {
  gamePk: number;
  gameDate: string;
  status: {
    statusCode: string;
    abstractGameState: string;
  };
  teams: {
    away: {
      score: number;
      team: {
        name: string;
        abbreviation: string;
        id: number;
      };
    };
    home: {
      score: number;
      team: {
        name: string;
        abbreviation: string;
        id: number;
      };
    };
  };
};

type NhlScheduleResponse = {
  dates: {
    date: string;
    games: NhlGame[];
  }[];
};

export async function fetchTodayGames(): Promise<NhlGame[]> {
  const response = await nhlApi.get<NhlScheduleResponse>('/schedule/today');
  const [day] = response.dates;
  return day?.games ?? [];
}

export async function fetchScheduleByDate(date: string): Promise<NhlGame[]> {
  const response = await nhlApi.get<NhlScheduleResponse>('/schedule', { date });
  const [day] = response.dates;
  return day?.games ?? [];
}

export type NhlStandingsRecord = {
  team: { id: number; name: string; abbreviation?: string };
  divisionRank: string;
  leagueRank: string;
  points: number;
  wins: number;
  losses: number;
  ot?: number;
  gamesPlayed: number;
};

type NhlStandingsResponse = {
  records?: {
    division: { name: string };
    teamRecords: NhlStandingsRecord[];
  }[];
};

export async function fetchStandings(season?: string): Promise<NhlStandingsResponse> {
  return nhlApi.get<NhlStandingsResponse>('/standings', season ? { season } : undefined);
}

export async function fetchGameFeed(gameId: number): Promise<unknown> {
  return nhlApi.get<unknown>(`/game/${gameId}/feed/live`);
}

