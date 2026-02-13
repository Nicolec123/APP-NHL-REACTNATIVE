import { create } from 'zustand';

export type AppMode = 'nhl' | 'olympics';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  favoriteTeams: number[];
};

/** Badge de fã baseado em uso (gamificação) */
export type FanBadge = 'rookie' | 'playoff' | 'hardcore' | 'olympic' | null;

type AppState = {
  /** NHL ou área Olímpica (hockey nas Olimpíadas) */
  mode: AppMode;
  user: UserProfile | null;
  token: string | null;
  favoriteTeams: number[];
  favoriteOlympicTeams: number[];
  gameDayTeamId: number | null;

  /** Preferências de notificação */
  notifyGames: boolean;
  notifyNews: boolean;
  notifyOlympics: boolean;
  reminderBeforeGame: boolean; // 30 min antes
  /** Preferências visuais */
  darkMode: boolean;
  themeAuto: boolean; // alternar tema NHL/Olimpíadas conforme contexto
  animatedBackground: boolean;
  /** Estatísticas locais (gamificação) */
  gamesWatched: number;
  newsRead: number;
  wallpapersDownloaded: number;

  setMode: (mode: AppMode) => void;
  setAuth: (payload: { user: UserProfile; token: string }) => void;
  logout: () => void;
  toggleFavoriteTeam: (teamId: number) => void;
  toggleFavoriteOlympicTeam: (teamId: number) => void;
  setGameDayTeam: (teamId: number | null) => void;
  setNotifyGames: (v: boolean) => void;
  setNotifyNews: (v: boolean) => void;
  setNotifyOlympics: (v: boolean) => void;
  setReminderBeforeGame: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setThemeAuto: (v: boolean) => void;
  setAnimatedBackground: (v: boolean) => void;
  incrementGamesWatched: () => void;
  incrementNewsRead: () => void;
  incrementWallpapersDownloaded: () => void;
  hydrateFromStorage: (data: Partial<Pick<AppState, 'user' | 'token' | 'favoriteTeams' | 'favoriteOlympicTeams' | 'mode' | 'notifyGames' | 'notifyNews' | 'darkMode'>>) => void;
};

export const useAppStore = create<AppState>(set => ({
  mode: 'nhl',
  user: null,
  token: null,
  favoriteTeams: [],
  favoriteOlympicTeams: [],
  gameDayTeamId: null,
  notifyGames: true,
  notifyNews: true,
  notifyOlympics: true,
  reminderBeforeGame: true,
  darkMode: false,
  themeAuto: false,
  animatedBackground: true,
  gamesWatched: 0,
  newsRead: 0,
  wallpapersDownloaded: 0,

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
  setNotifyGames: v => set({ notifyGames: v }),
  setNotifyNews: v => set({ notifyNews: v }),
  setNotifyOlympics: v => set({ notifyOlympics: v }),
  setReminderBeforeGame: v => set({ reminderBeforeGame: v }),
  setDarkMode: v => set({ darkMode: v }),
  setThemeAuto: v => set({ themeAuto: v }),
  setAnimatedBackground: v => set({ animatedBackground: v }),
  incrementGamesWatched: () => set(s => ({ gamesWatched: s.gamesWatched + 1 })),
  incrementNewsRead: () => set(s => ({ newsRead: s.newsRead + 1 })),
  incrementWallpapersDownloaded: () => set(s => ({ wallpapersDownloaded: s.wallpapersDownloaded + 1 })),
  hydrateFromStorage: data =>
    set(state => ({
      ...state,
      ...data
    }))
}));

