import { Router } from 'express';

// Rotas de usuário (perfil, favoritos, preferências) - versão simplificada para dev.

export const userRoutes = Router();

userRoutes.get('/me', (_req, res) => {
  // Em produção, leríamos o usuário autenticado do JWT.
  return res.json({
    id: 'dev-user-1',
    email: 'dev@icehub.app',
    name: 'Usuário Dev',
    favoriteTeamIds: [10, 20],
    notifyGames: true,
    notifyNews: true,
    darkMode: true
  });
});

userRoutes.put('/preferences', (req, res) => {
  const body = req.body;

  // Aqui apenas ecoamos o que veio, simulando um update bem-sucedido.
  return res.json({
    message: 'Preferências atualizadas (dev mock).',
    preferences: body
  });
});

