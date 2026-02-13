import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@store/useAppStore';

const STORAGE_KEY = '@icehub_app_state_v1';

export function useHydrateApp() {
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrate = useAppStore(state => state.hydrateFromStorage);
  const getSnapshot = useAppStore(state => ({
    user: state.user,
    token: state.token,
    favoriteTeams: state.favoriteTeams,
    favoriteOlympicTeams: state.favoriteOlympicTeams,
    mode: state.mode,
    notifyGames: state.notifyGames,
    notifyNews: state.notifyNews,
    darkMode: state.darkMode,
  }));

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          hydrate(parsed);
        }
      } catch {
        // ignora erro de hidratação
      } finally {
        setIsHydrated(true);
      }
    })();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const snapshot = getSnapshot;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {
      // ignora
    });
  }, [getSnapshot, isHydrated]);

  return { isHydrated };
}

