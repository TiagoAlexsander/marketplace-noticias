import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getQuery } from '../db';

export type UserRole = 'admin' | 'prestador' | 'usuario';

export type AuthenticatedUser = {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  prestador_status: string;
  foto_url?: string | null;
  bio?: string | null;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'upserv_jwt_secret_dev';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ erro: 'Token não informado' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ erro: 'Formato de token inválido' });
    }

    let decoded: { id: number; role: string };

    // Suporte legado: token no formato antigo token_${id}_${ts}
    if (token.startsWith('token_')) {
      const parts = token.split('_');
      const userId = parseInt(parts[1], 10);
      if (Number.isNaN(userId)) {
        return res.status(401).json({ erro: 'Token inválido' });
      }
      decoded = { id: userId, role: '' };
    } else {
      // Verificação JWT real
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
      } catch {
        return res.status(401).json({ erro: 'Token expirado ou inválido' });
      }
    }

    const user = await getQuery(
      'SELECT id, nome, email, role, prestador_status, foto_url, bio FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ erro: 'Usuário do token não encontrado' });
    }

    req.user = user as AuthenticatedUser;
    return next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ erro: 'Erro ao validar autenticação' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil' });
    }
    return next();
  };
};
