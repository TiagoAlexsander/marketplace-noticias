import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getQuery, runQuery } from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'upserv_jwt_secret_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// Gera JWT real com os dados do usuário
const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
};

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const user = await getQuery('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    // Atualiza o último acesso
    await runQuery('UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = generateToken(user.id, user.role);

    return res.json({
      sucesso: true,
      dados: {
        token,
        usuario: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          prestador_status: user.prestador_status,
          foto_url: user.foto_url || null,
          bio: user.bio || null,
        },
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// POST /auth/recuperar-senha (simulado)
router.post('/recuperar-senha', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }

    const user = await getQuery('SELECT id FROM usuarios WHERE email = ?', [email]);

    // Não revela se o email existe
    console.log(user ? `Recuperação solicitada para: ${email}` : `Email não encontrado: ${email}`);

    return res.json({
      sucesso: true,
      mensagem: 'Se o email estiver cadastrado, você receberá instruções em breve.',
    });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    return res.status(500).json({ erro: 'Erro ao recuperar senha' });
  }
});

export default router;
