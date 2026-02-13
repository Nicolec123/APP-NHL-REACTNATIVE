import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * Wallpapers: TheSportsDB (gratuita, key 123 ou THESPORTSDB_API_KEY) para
 * banners/fanart dos times NHL. Fallback: imagens genéricas de hockey.
 */
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json';

export const wallpapersRoutes = Router();

/** Imagens genéricas de hockey no gelo (Unsplash – rinque, jogo, arena). */
const GENERIC_WALLPAPERS = [
  {
    id: 'generic-ice-1',
    teamId: null as string | null,
    title: 'Rink Gelado',
    imageUrl:
      'https://images.unsplash.com/photo-1644553054315-9fb69509f932?w=1200&q=80'
  },
  {
    id: 'generic-puck-1',
    teamId: null,
    title: 'Hockey no Gelo',
    imageUrl:
      'https://images.unsplash.com/photo-1610359156022-70098c24beda?w=1200&q=80'
  },
  {
    id: 'generic-arena-1',
    teamId: null,
    title: 'Arena de Hockey',
    imageUrl:
      'https://images.unsplash.com/photo-1674571579456-62fdb093589f?w=1200&q=80'
  }
];

async function fetchNhlTeamsFromSportsDb(): Promise<
  { id: string; teamId: string | null; title: string; imageUrl: string }[]
> {
  const key = config.theSportsDbApiKey;
  try {
    const { data } = await axios.get(
      `${THESPORTSDB_BASE}/${key}/searchteams.php?t=NHL`,
      { timeout: 8000 }
    );
    const teams = data?.teams ?? [];
    const list: { id: string; teamId: string | null; title: string; imageUrl: string }[] = [];
    for (const t of teams) {
      if (t.strSport !== 'Ice Hockey') continue;
      const img = t.strBanner || t.strFanart1 || t.strLogo;
      if (img) {
        list.push({
          id: `sdb-${t.idTeam}`,
          teamId: t.idTeam,
          title: t.strTeam ?? 'NHL Team',
          imageUrl: img
        });
      }
    }
    return list;
  } catch {
    return [];
  }
}

wallpapersRoutes.get('/', async (req, res) => {
  try {
    const teamId = req.query.teamId as string | undefined;
    const fromDb = await fetchNhlTeamsFromSportsDb();
    const wallpapers = [...GENERIC_WALLPAPERS, ...fromDb];
    const filtered =
      teamId != null
        ? wallpapers.filter(w => w.teamId === null || String(w.teamId) === String(teamId))
        : wallpapers;
    return res.json({ wallpapers: filtered });
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar wallpapers', error?.message);
    return res.json({ wallpapers: GENERIC_WALLPAPERS });
  }
});

