import { Router } from 'express';

// Rotas de autenticação (stub / mock para desenvolvimento inicial)
// Depois podemos conectar com Prisma e JWT de verdade.

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => {
  const { email } = req.body ?? {};

  // Resposta fake só para permitir que o frontend integre enquanto o backend é evoluído
  return res.json({
    token: 'dev-mock-token',
    user: {
      id: 'dev-user-1',
      email: email ?? 'dev@icehub.app',
      name: 'Usuário Dev',
      favoriteTeamIds: [10, 20], // exemplo
      notifyGames: true,
      notifyNews: true,
      darkMode: true
    }
  });
});

authRoutes.post('/register', (req, res) => {
  const { email, name } = req.body ?? {};

  return res.status(201).json({
    message: 'Cadastro fake criado com sucesso (dev).',
    user: {
      id: 'dev-user-1',
      email,
      name: name ?? 'Novo Usuário',
      favoriteTeamIds: [],
      notifyGames: true,
      notifyNews: true,
      darkMode: true
    }
  });
});

