import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * Notícias NHL:
 * - NewsAPI (opcional, paga em produção) – NEWS_API_KEY
 * - GNews (alternativa gratuita, 100 req/dia) – GNEWS_API_KEY
 * Sem chave: fallback mock ou tenta GNews se tiver chave.
 */
export const newsRoutes = Router();

type Article = {
  title: string;
  description?: string;
  url: string;
  publishedAt: string;
  urlToImage?: string;
  source?: string;
};

function mockArticles(): Article[] {
  return [
    {
      title: 'Configure GNEWS_API_KEY ou NEWS_API_KEY no .env',
      description: 'GNews: gratuito 100 req/dia. NewsAPI: requer chave.',
      url: 'https://gnews.io',
      publishedAt: new Date().toISOString()
    }
  ];
}

async function fetchGNews(query: string): Promise<Article[]> {
  if (!config.gnewsApiKey) return [];
  const { data } = await axios.get('https://gnews.io/api/v4/search', {
    params: {
      token: config.gnewsApiKey,
      q: query,
      lang: 'en',
      max: 10,
      sortby: 'publishedAt'
    },
    timeout: 10000
  });
  const items = data?.articles ?? data?.news ?? [];
  return items.map((a: any) => ({
    title: a.title ?? '',
    description: a.description ?? a.content?.substring?.(0, 160),
    url: a.url ?? a.link ?? '',
    publishedAt: a.publishedAt ?? a.publishDate ?? new Date().toISOString(),
    urlToImage: a.image,
    source: a.source?.name ?? a.source
  }));
}

async function fetchNewsApi(query: string): Promise<Article[]> {
  if (!config.newsApiKey) return [];
  const { data } = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      apiKey: config.newsApiKey,
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 10
    },
    timeout: 10000
  });
  const items = data?.articles ?? [];
  return items.map((a: any) => ({
    title: a.title ?? '',
    description: a.description ?? '',
    url: a.url ?? '',
    publishedAt: a.publishedAt ?? '',
    urlToImage: a.urlToImage,
    source: a.source?.name
  }));
}

newsRoutes.get('/', async (req, res) => {
  try {
    const query = (req.query.q as string) || 'NHL hockey';

    let articles: Article[] = await fetchNewsApi(query);
    let source = 'newsapi';
    if (articles.length === 0) {
      articles = await fetchGNews(query);
      source = 'gnews';
    }
    if (articles.length === 0) {
      articles = mockArticles();
      source = 'mock';
    }

    return res.json({ source, articles });
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar notícias', error?.message);
    try {
      const articles = await fetchGNews((req.query.q as string) || 'NHL hockey');
      if (articles.length > 0) return res.json({ source: 'gnews', articles });
    } catch {
      // ignora
    }
    return res.status(500).json({ message: 'Não foi possível buscar notícias agora.' });
  }
});

