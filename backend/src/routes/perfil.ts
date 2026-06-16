import { Router } from 'express';
import { getQuery, runQuery } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /perfil — retorna perfil do usuário logado com saldo e status de prestador
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const usuario = await getQuery(
      'SELECT id, nome, email, role, prestador_status, foto_url, bio, criado_em FROM usuarios WHERE id = ?',
      [req.user!.id]
    );

    const carteira = await getQuery(
      'SELECT saldo FROM carteiras WHERE usuario_id = ?',
      [req.user!.id]
    );

    return res.json({
      sucesso: true,
      dados: {
        ...usuario,
        saldo: carteira?.saldo ?? 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});

// PUT /perfil — atualiza nome, bio e foto do usuário logado
router.put('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { nome, bio, foto_url } = req.body as {
      nome?: string;
      bio?: string;
      foto_url?: string;
    };

    const updates: string[] = [];
    const values: any[] = [];

    if (nome?.trim()) {
      updates.push('nome = ?');
      values.push(nome.trim());
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (foto_url !== undefined) {
      updates.push('foto_url = ?');
      values.push(foto_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    values.push(req.user!.id);
    await runQuery(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    const atualizado = await getQuery(
      'SELECT id, nome, email, role, prestador_status, foto_url, bio FROM usuarios WHERE id = ?',
      [req.user!.id]
    );

    return res.json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso',
      dados: atualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
});

export default router;
