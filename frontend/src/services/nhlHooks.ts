import { useCallback, useEffect, useState } from 'react';
import { fetchTodayGames, NhlGame } from './nhlApi';

type TodayGamesState = {
  games: (NhlGame & { gameDateLocal: string })[];
  isLoading: boolean;
  error: string | null;
};

export function useTodayGames(): {
  games: TodayGamesState['games'];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [state, setState] = useState<TodayGamesState>({
    games: [],
    isLoading: true,
    error: null
  });

  const load = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const games = await fetchTodayGames();

      const withLocalDate = games.map(game => {
        const localDate = new Date(game.gameDate);
        const gameDateLocal = localDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return { ...game, gameDateLocal };
      });

      setState({ games: withLocalDate, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Não foi possível carregar os jogos de hoje.'
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    games: state.games,
    isLoading: state.isLoading,
    error: state.error,
    refetch: load
  };
}

