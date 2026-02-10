import { API_BASE_URL } from '../config';

export type Wallpaper = {
  id: string;
  teamId: string | null;
  title: string;
  imageUrl: string;
};

type WallpapersResponse = {
  wallpapers: Wallpaper[];
};

export async function fetchWallpapers(teamId?: string): Promise<Wallpaper[]> {
  const url = new URL(`${API_BASE_URL}/api/wallpapers`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data: WallpapersResponse = await res.json();
  return data.wallpapers ?? [];
}
