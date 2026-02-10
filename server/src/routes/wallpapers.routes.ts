import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * Wallpapers: TheSportsDB (gratuita, key 123 ou THESPORTSDB_API_KEY) para
 * banners/fanart dos times NHL. Fallback: imagens genéricas de hockey.
 */
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json';

export const wallpapersRoutes = Router();

const GENERIC_WALLPAPERS = [
  {
    id: 'generic-ice-1',
    teamId: null as string | null,
    title: 'Rink Gelado',
    imageUrl:
      'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 'generic-puck-1',
    teamId: null,
    title: 'Hockey no Gelo',
    imageUrl:
      'https://images.pexels.com/photos/274192/pexels-photo-274192.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 'generic-arena-1',
    teamId: null,
    title: 'Arena NHL',
    imageUrl:
      'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1200'
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

