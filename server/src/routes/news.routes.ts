import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';
import { translateToPt } from '../utils/translate';

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

async function translateArticlesToPt(source: string, articles: Article[]): Promise<Article[]> {
  // Mock já está em português
  if (source === 'mock') return articles;

  return Promise.all(
    articles.map(async (article) => ({
      ...article,
      title: article.title ? await translateToPt(article.title) : article.title,
      description: article.description ? await translateToPt(article.description) : article.description,
    }))
  );
}

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

    const translated = await translateArticlesToPt(source, articles);
    return res.json({ source, articles: translated });
  } catch (error: any) {
    console.error('[IceHub API] Erro ao buscar notícias', error?.message);
    try {
      const articles = await fetchGNews((req.query.q as string) || 'NHL hockey');
      if (articles.length > 0) {
        const translated = await translateArticlesToPt('gnews', articles);
        return res.json({ source: 'gnews', articles: translated });
      }
    } catch {
      // ignora
    }
    return res.status(500).json({ message: 'Não foi possível buscar notícias agora.' });
  }
});

