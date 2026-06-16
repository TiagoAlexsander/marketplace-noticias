import { Router } from 'express';
import { getQuery, runQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /favoritos — lista favoritos do usuário com detalhes do serviço
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const favoritos = await allQuery(
      `SELECT
         f.id AS favorito_id,
         f.criado_em AS favoritado_em,
         s.id,
         s.nome,
         s.descricao,
         s.preco,
         s.status,
         u.nome AS prestador_nome,
         u.email AS prestador_email,
         p.descricao AS prestador_descricao
       FROM favoritos f
       INNER JOIN servicos s ON s.id = f.servico_id
       INNER JOIN prestadores p ON p.id = s.prestador_id
       INNER JOIN usuarios u ON u.id = p.usuario_id
       WHERE f.usuario_id = ?
         AND s.status = 'aprovado'
       ORDER BY f.id DESC`,
      [req.user!.id]
    );

    return res.json({ sucesso: true, total: favoritos.length, dados: favoritos });
  } catch (error) {
    console.error('Erro ao listar favoritos:', error);
    return res.status(500).json({ erro: 'Erro ao listar favoritos' });
  }
});

// POST /favoritos/:servico_id — adiciona aos favoritos
router.post('/:servico_id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { servico_id } = req.params;

    const servico = await getQuery(
      "SELECT id FROM servicos WHERE id = ? AND status = 'aprovado'",
      [parseInt(servico_id)]
    );

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    const jaFavoritado = await getQuery(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND servico_id = ?',
      [req.user!.id, parseInt(servico_id)]
    );

    if (jaFavoritado) {
      return res.status(409).json({ erro: 'Serviço já está nos favoritos' });
    }

    await runQuery(
      'INSERT INTO favoritos (usuario_id, servico_id) VALUES (?, ?)',
      [req.user!.id, parseInt(servico_id)]
    );

    return res.status(201).json({ sucesso: true, mensagem: 'Adicionado aos favoritos' });
  } catch (error) {
    console.error('Erro ao favoritar:', error);
    return res.status(500).json({ erro: 'Erro ao favoritar serviço' });
  }
});

// DELETE /favoritos/:servico_id — remove dos favoritos
router.delete('/:servico_id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { servico_id } = req.params;

    const result = await runQuery(
      'DELETE FROM favoritos WHERE usuario_id = ? AND servico_id = ?',
      [req.user!.id, parseInt(servico_id)]
    );

    if (result.changes === 0) {
      return res.status(404).json({ erro: 'Favorito não encontrado' });
    }

    return res.json({ sucesso: true, mensagem: 'Removido dos favoritos' });
  } catch (error) {
    console.error('Erro ao desfavoritar:', error);
    return res.status(500).json({ erro: 'Erro ao remover favorito' });
  }
});

export default router;
