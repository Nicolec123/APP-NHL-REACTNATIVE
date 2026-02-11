import axios from 'axios';

const DEFAULT_LIBRE_URL = 'https://libretranslate.com/translate';

/**
 * Traduz um texto de inglês para português usando a API do LibreTranslate.
 * Caso haja erro ou texto vazio, devolve o texto original.
 */
export async function translateToPt(text: string): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed) return text;

  try {
    const apiKey = process.env.LIBRETRANSLATE_API_KEY;
    const url = process.env.LIBRETRANSLATE_URL || DEFAULT_LIBRE_URL;

    // Se não houver API key configurada, não tenta traduzir para evitar erros 400/403/429.
    // O texto volta em inglês mesmo, sem quebrar o app.
    if (!apiKey) {
      return text;
    }

    const { data } = await axios.post(
      url,
      {
        q: trimmed,
        source: 'en',
        target: 'pt',
        format: 'text',
        api_key: apiKey,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const translated: string | undefined = data?.translatedText;
    return translated && translated.trim().length > 0 ? translated : text;
  } catch (error: any) {
    console.error('[IceHub API] Erro ao traduzir texto', error?.message);
    return text;
  }
}

