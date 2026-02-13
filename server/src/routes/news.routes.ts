import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';
import { translateToPt } from '../services/translate.service';

/**
 * Notícias NHL/Olimpíadas:
 * - NewsAPI (NEWS_API_KEY) e GNews (GNEWS_API_KEY), com prioridade português e fallback inglês.
 * - Tradução automática no backend: notícias em inglês são traduzidas para PT (LibreTranslate, sem chave).
 * - Frontend só exibe; tradução é feita no backend.
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

/** Traduz título e descrição de cada artigo para português (inglês → PT). Mock já está em PT. */
async function translateArticlesToPt(source: string, articles: Article[]): Promise<Article[]> {
  if (source === 'mock') return articles;

  const translated: Article[] = [];
  for (const article of articles) {
    const title = article.title ? await translateToPt(article.title) : article.title;
    const description = article.description ? await translateToPt(article.description) : article.description;
    translated.push({ ...article, title, description });
  }
  return translated;
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

/** ETAPA 4 – Busca GNews; lang=pt e country=br primeiro, fallback para inglês se vazio. */
async function fetchGNews(query: string, lang: 'pt' | 'en' = 'pt'): Promise<Article[]> {
  if (!config.gnewsApiKey) return [];
  const { data } = await axios.get('https://gnews.io/api/v4/search', {
    params: {
      token: config.gnewsApiKey,
      q: query,
      lang: lang === 'pt' ? 'pt' : 'en',
      country: lang === 'pt' ? 'br' : undefined,
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

/** ETAPA 4 – Busca NewsAPI; language=pt primeiro, fallback para en se vazio. */
async function fetchNewsApi(query: string, language: 'pt' | 'en' = 'pt'): Promise<Article[]> {
  if (!config.newsApiKey) return [];
  const { data } = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      apiKey: config.newsApiKey,
      q: query,
      language,
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

    let articles: Article[] = await fetchNewsApi(query, 'pt');
    let source = 'newsapi';
    if (articles.length === 0) {
      articles = await fetchNewsApi(query, 'en');
    }
    if (articles.length === 0) {
      articles = await fetchGNews(query, 'pt');
      source = 'gnews';
    }
    if (articles.length === 0) {
      articles = await fetchGNews(query, 'en');
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
      let articles = await fetchGNews((req.query.q as string) || 'NHL hockey', 'pt');
      if (articles.length === 0) articles = await fetchGNews((req.query.q as string) || 'NHL hockey', 'en');
      if (articles.length > 0) {
        const translated = await translateArticlesToPt('gnews', articles);
        return res.json({ source: 'gnews', articles: translated });
      }
    } catch {
      // ignora
    }
    return res.json({ source: 'mock', articles: mockArticles() });
  }
});

