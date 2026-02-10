import { create } from 'zustand';

export type AppMode = 'nhl' | 'olympics';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  favoriteTeams: number[];
};

type AppState = {
  /** NHL ou área Olímpica (hockey nas Olimpíadas) */
  mode: AppMode;
  user: UserProfile | null;
  token: string | null;
  favoriteTeams: number[];
  /** IDs de seleções olímpicas favoritas (quando mode === 'olympics') */
  favoriteOlympicTeams: number[];
  gameDayTeamId: number | null;
  setMode: (mode: AppMode) => void;
  setAuth: (payload: { user: UserProfile; token: string }) => void;
  logout: () => void;
  toggleFavoriteTeam: (teamId: number) => void;
  toggleFavoriteOlympicTeam: (teamId: number) => void;
  setGameDayTeam: (teamId: number | null) => void;
  hydrateFromStorage: (data: Partial<Pick<AppState, 'user' | 'token' | 'favoriteTeams' | 'favoriteOlympicTeams' | 'mode'>>) => void;
};

export const useAppStore = create<AppState>(set => ({
  mode: 'nhl',
  user: null,
  token: null,
  favoriteTeams: [],
  favoriteOlympicTeams: [],
  gameDayTeamId: null,
  setMode: mode => set({ mode }),
  setAuth: ({ user, token }) =>
    set({
      user,
      token,
      favoriteTeams: user.favoriteTeams ?? []
    }),
  logout: () =>
    set({
      user: null,
      token: null,
      favoriteTeams: [],
      favoriteOlympicTeams: [],
      gameDayTeamId: null
    }),
  toggleFavoriteTeam: teamId =>
    set(state => {
      const exists = state.favoriteTeams.includes(teamId);
      const favoriteTeams = exists
        ? state.favoriteTeams.filter(id => id !== teamId)
        : [...state.favoriteTeams, teamId];
      return { favoriteTeams };
    }),
  toggleFavoriteOlympicTeam: teamId =>
    set(state => {
      const exists = state.favoriteOlympicTeams.includes(teamId);
      const favoriteOlympicTeams = exists
        ? state.favoriteOlympicTeams.filter(id => id !== teamId)
        : [...state.favoriteOlympicTeams, teamId];
      return { favoriteOlympicTeams };
    }),
  setGameDayTeam: teamId => set({ gameDayTeamId: teamId }),
  hydrateFromStorage: data =>
    set(state => ({
      ...state,
      ...data
    }))
}));

