/**
 * IceHub API - Servidor principal
 * Inicia Express, middlewares, rotas e conexao com banco
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { nhlProxyRoutes } from './routes/nhl-proxy.routes';
import { newsRoutes } from './routes/news.routes';
import { wallpapersRoutes } from './routes/wallpapers.routes';
import { sportsdbRoutes } from './routes/sportsdb.routes';
import { hockeyApiRoutes } from './routes/hockey-api.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// Rotas publicas e protegidas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/nhl', nhlProxyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/wallpapers', wallpapersRoutes);
app.use('/api/sportsdb', sportsdbRoutes);
app.use('/api/hockey', hockeyApiRoutes);

// Health check para deploy
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'icehub-api' });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[IceHub API] Rodando na porta ${config.port}`);
});
