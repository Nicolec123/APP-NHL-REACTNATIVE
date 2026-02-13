export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:8081',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d'
  },
  newsApiKey: process.env.NEWS_API_KEY ?? '',
  gnewsApiKey: process.env.GNEWS_API_KEY ?? '',
  theSportsDbApiKey: process.env.THESPORTSDB_API_KEY ?? '123',
  apiSportsHockeyKey: process.env.APISPORTS_HOCKEY_KEY ?? '',
  /** URL do JSON remoto dos jogos olímpicos 2026 (GitHub raw, Vercel, etc.). Se vazio, tenta arquivo local data/olympics2026.json */
  remoteOlympicsJsonUrl: process.env.REMOTE_OLYMPICS_JSON_URL ?? '',
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db'
};

