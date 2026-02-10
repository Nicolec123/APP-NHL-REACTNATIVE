import { Router, Request } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * TheSportsDB – logos dos times NHL (API gratuita, key 123 ou THESPORTSDB_API_KEY).
 */
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json';

export const sportsdbRoutes = Router();

const NHL_ABBR_TO_QUERY: Record<string, string> = {
  TOR: 'Toronto Maple Leafs',
  MTL: 'Montreal Canadiens',
  BOS: 'Boston Bruins',
  CHI: 'Chicago Blackhawks',
  DET: 'Detroit Red Wings',
  NYR: 'New York Rangers',
  EDM: 'Edmonton Oilers',
  CGY: 'Calgary Flames',
  VAN: 'Vancouver Canucks',
  WPG: 'Winnipeg Jets',
  OTT: 'Ottawa Senators',
  TBL: 'Tampa Bay Lightning',
  FLA: 'Florida Panthers',
  WSH: 'Washington Capitals',
  PIT: 'Pittsburgh Penguins',
  PHI: 'Philadelphia Flyers',
  NJD: 'New Jersey Devils',
  NYI: 'New York Islanders',
  BUF: 'Buffalo Sabres',
  CAR: 'Carolina Hurricanes',
  CBJ: 'Columbus Blue Jackets',
  NSH: 'Nashville Predators',
  STL: 'St. Louis Blues',
  MIN: 'Minnesota Wild',
  COL: 'Colorado Avalanche',
  DAL: 'Dallas Stars',
  ARI: 'Arizona Coyotes',
  UTA: 'Utah Hockey Club',
  VGK: 'Vegas Golden Knights',
  ANA: 'Anaheim Ducks',
  LAK: 'Los Angeles Kings',
  SJS: 'San Jose Sharks',
  SEA: 'Seattle Kraken'
};

const logoCache = new Map<string, { url: string; ts: number }>();
const CACHE_MS = 1000 * 60 * 60;

async function fetchLogoForAbbr(abbr: string): Promise<string | null> {
  const key = config.theSportsDbApiKey;
  const query = NHL_ABBR_TO_QUERY[abbr.toUpperCase()];
  if (!query) return null;
  try {
    const { data } = await axios.get(
      `${THESPORTSDB_BASE}/${key}/searchteams.php?t=${encodeURIComponent(query)}`,
      { timeout: 6000 }
    );
    const teams = data?.teams;
    const team = Array.isArray(teams) ? teams[0] : teams;
    if (team?.strSport === 'Ice Hockey' && (team.strBadge || team.strLogo)) {
      return team.strBadge || team.strLogo;
    }
  } catch {
    // ignora
  }
  return null;
}

sportsdbRoutes.get('/nhl-logos', async (req: Request<{}, {}, {}, { abbreviations?: string }>, res) => {
  try {
    const abbrs = (req.query.abbreviations as string)?.toUpperCase().split(',').filter(Boolean)
      ?? Object.keys(NHL_ABBR_TO_QUERY);
    const result: Record<string, string> = {};
    const now = Date.now();
    for (const abbr of abbrs) {
      const cached = logoCache.get(abbr);
      if (cached && now - cached.ts < CACHE_MS) {
        result[abbr] = cached.url;
        continue;
      }
      const url = await fetchLogoForAbbr(abbr);
      if (url) {
        logoCache.set(abbr, { url, ts: now });
        result[abbr] = url;
      }
    }
    return res.json({ logos: result });
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar logos', error?.message);
    return res.json({ logos: {} });
  }
});
