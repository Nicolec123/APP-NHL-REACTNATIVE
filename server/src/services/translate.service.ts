import axios from 'axios';

const LIBRE_URL = 'https://libretranslate.de/translate';

/** Cache de tradução para não repetir chamadas à API (texto original → traduzido). */
const translationCache = new Map<string, string>();
const CACHE_MAX_SIZE = 500;

export async function translateToPt(text: string): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed) return text ?? '';

  const cached = translationCache.get(trimmed);
  if (cached !== undefined) return cached;

  try {
    const res = await axios.post(
      LIBRE_URL,
      {
        q: trimmed,
        source: 'en',
        target: 'pt',
        format: 'text'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    const translated = res.data?.translatedText?.trim() || trimmed;
    if (translationCache.size < CACHE_MAX_SIZE) {
      translationCache.set(trimmed, translated);
    }
    return translated;
  } catch (err: any) {
    console.warn('[IceHub API] Erro ao traduzir:', err?.message ?? err);
    return trimmed;
  }
}
