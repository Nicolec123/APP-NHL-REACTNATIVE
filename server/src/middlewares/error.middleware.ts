import { NextFunction, Request, Response } from 'express';

// Middleware simples de tratamento de erros para desenvolvimento
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[IceHub API][ERROR]', err);

  const status = err.statusCode ?? err.status ?? 500;
  const message =
    err.message ?? 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.';

  res.status(status).json({
    message,
    // Em produção normalmente não se expõe o stack,
    // mas em dev ajuda bastante.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

