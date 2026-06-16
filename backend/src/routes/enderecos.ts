import { Router } from 'express';
import { getQuery, runQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /enderecos — lista endereços do usuário logado
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const enderecos = await allQuery(
      'SELECT * FROM enderecos WHERE usuario_id = ? ORDER BY is_padrao DESC, id DESC',
      [req.user!.id]
    );
    return res.json({ sucesso: true, total: enderecos.length, dados: enderecos });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    return res.status(500).json({ erro: 'Erro ao listar endereços' });
  }
});

// POST /enderecos — cria novo endereço
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { label, logradouro, numero, complemento, bairro, cidade, estado, cep, is_padrao } = req.body;

    if (!label || !logradouro || !cidade || !estado) {
      return res.status(400).json({ erro: 'label, logradouro, cidade e estado são obrigatórios' });
    }

    // Se for o primeiro endereço ou marcado como padrão, remove o padrão anterior
    if (is_padrao) {
      await runQuery('UPDATE enderecos SET is_padrao = 0 WHERE usuario_id = ?', [req.user!.id]);
    }

    // Primeiro endereço vira padrão automaticamente
    const count = await getQuery(
      'SELECT COUNT(*) AS total FROM enderecos WHERE usuario_id = ?',
      [req.user!.id]
    );
    const isPadrao = is_padrao || (count?.total || 0) === 0 ? 1 : 0;

    const result = await runQuery(
      `INSERT INTO enderecos
       (usuario_id, label, logradouro, numero, complemento, bairro, cidade, estado, cep, is_padrao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user!.id, label, logradouro, numero || null, complemento || null,
       bairro || null, cidade, estado, cep || null, isPadrao]
    );

    const novo = await getQuery('SELECT * FROM enderecos WHERE id = ?', [result.lastID]);

    return res.status(201).json({ sucesso: true, mensagem: 'Endereço criado', dados: novo });
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return res.status(500).json({ erro: 'Erro ao criar endereço' });
  }
});

// PUT /enderecos/:id — atualiza endereço
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { label, logradouro, numero, complemento, bairro, cidade, estado, cep, is_padrao } = req.body;

    const endereco = await getQuery(
      'SELECT id FROM enderecos WHERE id = ? AND usuario_id = ?',
      [parseInt(id), req.user!.id]
    );

    if (!endereco) {
      return res.status(404).json({ erro: 'Endereço não encontrado' });
    }

    if (is_padrao) {
      await runQuery('UPDATE enderecos SET is_padrao = 0 WHERE usuario_id = ?', [req.user!.id]);
    }

    await runQuery(
      `UPDATE enderecos SET
       label = COALESCE(?, label),
       logradouro = COALESCE(?, logradouro),
       numero = ?,
       complemento = ?,
       bairro = ?,
       cidade = COALESCE(?, cidade),
       estado = COALESCE(?, estado),
       cep = ?
       ${is_padrao ? ', is_padrao = 1' : ''}
       WHERE id = ?`,
      [label, logradouro, numero || null, complemento || null, bairro || null,
       cidade, estado, cep || null, parseInt(id)]
    );

    const atualizado = await getQuery('SELECT * FROM enderecos WHERE id = ?', [parseInt(id)]);
    return res.json({ sucesso: true, mensagem: 'Endereço atualizado', dados: atualizado });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar endereço' });
  }
});

// DELETE /enderecos/:id — remove endereço
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      'DELETE FROM enderecos WHERE id = ? AND usuario_id = ?',
      [parseInt(id), req.user!.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ erro: 'Endereço não encontrado' });
    }

    return res.json({ sucesso: true, mensagem: 'Endereço removido' });
  } catch (error) {
    console.error('Erro ao remover endereço:', error);
    return res.status(500).json({ erro: 'Erro ao remover endereço' });
  }
});

export default router;
