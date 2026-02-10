import { API_BASE_URL } from '../config';

export type NewsArticle = {
  title: string;
  description?: string;
  url: string;
  publishedAt: string;
  urlToImage?: string;
  source?: string;
};

type NewsResponse = {
  source: string;
  articles: NewsArticle[];
};

export async function fetchNews(query?: string): Promise<NewsArticle[]> {
  const url = new URL(`${API_BASE_URL}/api/news`);
  if (query) url.searchParams.set('q', query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Não foi possível carregar notícias.');
  const data: NewsResponse = await res.json();
  return data.articles ?? [];
}
