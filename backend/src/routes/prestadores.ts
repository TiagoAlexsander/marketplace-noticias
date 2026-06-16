import { Router } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/solicitar', requireAuth, requireRole('usuario'), async (req: AuthenticatedRequest, res) => {
  try {
    const { descricao } = req.body as { descricao?: string };

    const solicitacaoPendente = await getQuery(
      'SELECT id FROM solicitacoes_prestador WHERE usuario_id = ? AND status = ?',
      [req.user!.id, 'pendente']
    );

    if (solicitacaoPendente) {
      return res.status(409).json({ erro: 'Ja existe solicitacao pendente para este usuario' });
    }

    await runQuery(
      'INSERT INTO solicitacoes_prestador (usuario_id, descricao, status) VALUES (?, ?, ?)',
      [req.user!.id, descricao || null, 'pendente']
    );

    await runQuery('UPDATE usuarios SET prestador_status = ? WHERE id = ?', ['pendente', req.user!.id]);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Solicitacao enviada para analise do admin',
    });
  } catch (error) {
    console.error('Erro ao solicitar perfil de prestador:', error);
    return res.status(500).json({ erro: 'Erro ao solicitar perfil de prestador' });
  }
});

router.get('/solicitacoes', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const solicitacoes = await allQuery(`
      SELECT
        s.id,
        s.usuario_id,
        s.descricao,
        s.status,
        s.motivo,
        s.criado_em,
        u.nome,
        u.email
      FROM solicitacoes_prestador s
      INNER JOIN usuarios u ON u.id = s.usuario_id
      ORDER BY s.id DESC
    `);

    return res.json({
      sucesso: true,
      total: solicitacoes.length,
      dados: solicitacoes,
    });
  } catch (error) {
    console.error('Erro ao listar solicitacoes de prestador:', error);
    return res.status(500).json({ erro: 'Erro ao listar solicitacoes de prestador' });
  }
});

router.post('/solicitacoes/:id/aprovar', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await getQuery(
      'SELECT * FROM solicitacoes_prestador WHERE id = ? AND status = ?',
      [parseInt(id), 'pendente']
    );

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitacao pendente nao encontrada' });
    }

    await runQuery(
      'UPDATE solicitacoes_prestador SET status = ?, analisado_por = ?, analisado_em = CURRENT_TIMESTAMP WHERE id = ?',
      ['aprovado', req.user!.id, parseInt(id)]
    );

    await runQuery(
      'UPDATE usuarios SET role = ?, prestador_status = ? WHERE id = ?',
      ['prestador', 'aprovado', solicitacao.usuario_id]
    );

    const prestadorExistente = await getQuery('SELECT id FROM prestadores WHERE usuario_id = ?', [solicitacao.usuario_id]);

    if (!prestadorExistente) {
      await runQuery(
        'INSERT INTO prestadores (usuario_id, descricao) VALUES (?, ?)',
        [solicitacao.usuario_id, solicitacao.descricao || null]
      );
    }

    return res.json({
      sucesso: true,
      mensagem: 'Solicitacao aprovada e usuario promovido para prestador',
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitacao de prestador:', error);
    return res.status(500).json({ erro: 'Erro ao aprovar solicitacao de prestador' });
  }
});

router.post('/solicitacoes/:id/rejeitar', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body as { motivo?: string };

    const solicitacao = await getQuery(
      'SELECT * FROM solicitacoes_prestador WHERE id = ? AND status = ?',
      [parseInt(id), 'pendente']
    );

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitacao pendente nao encontrada' });
    }

    await runQuery(
      'UPDATE solicitacoes_prestador SET status = ?, motivo = ?, analisado_por = ?, analisado_em = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejeitado', motivo || null, req.user!.id, parseInt(id)]
    );

    await runQuery(
      'UPDATE usuarios SET prestador_status = ? WHERE id = ?',
      ['rejeitado', solicitacao.usuario_id]
    );

    return res.json({
      sucesso: true,
      mensagem: 'Solicitacao rejeitada',
    });
  } catch (error) {
    console.error('Erro ao rejeitar solicitacao de prestador:', error);
    return res.status(500).json({ erro: 'Erro ao rejeitar solicitacao de prestador' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  try {
    const prestadores = await allQuery(`
      SELECT
        p.id,
        p.usuario_id,
        p.descricao,
        p.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM prestadores p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      ORDER BY p.id DESC
    `);

    return res.json({
      sucesso: true,
      total: prestadores.length,
      dados: prestadores,
    });
  } catch (error) {
    console.error('Erro ao listar prestadores:', error);
    return res.status(500).json({ erro: 'Erro ao listar prestadores' });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { usuario_id, descricao } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ erro: 'usuario_id e obrigatorio' });
    }

    const usuario = await getQuery('SELECT id, nome, email FROM usuarios WHERE id = ?', [usuario_id]);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuario nao encontrado' });
    }

    const prestadorExistente = await getQuery('SELECT * FROM prestadores WHERE usuario_id = ?', [usuario_id]);
    if (prestadorExistente) {
      return res.status(409).json({ erro: 'Este usuario ja e um prestador' });
    }

    const result = await runQuery(
      'INSERT INTO prestadores (usuario_id, descricao) VALUES (?, ?)',
      [usuario_id, descricao || null]
    );

    await runQuery('UPDATE usuarios SET role = ?, prestador_status = ? WHERE id = ?', ['prestador', 'aprovado', usuario_id]);

    const novoPrestador = await getQuery(
      `
      SELECT
        p.id,
        p.usuario_id,
        p.descricao,
        p.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM prestadores p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
      `,
      [result.lastID]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Prestador criado com sucesso',
      dados: novoPrestador,
    });
  } catch (error) {
    console.error('Erro ao criar prestador:', error);
    return res.status(500).json({ erro: 'Erro ao criar prestador' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const prestador = await getQuery(
      `
      SELECT
        p.id,
        p.usuario_id,
        p.descricao,
        p.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM prestadores p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
      `,
      [parseInt(id)]
    );

    if (!prestador) {
      return res.status(404).json({ erro: 'Prestador nao encontrado' });
    }

    return res.json({ sucesso: true, dados: prestador });
  } catch (error) {
    console.error('Erro ao buscar prestador:', error);
    return res.status(500).json({ erro: 'Erro ao buscar prestador' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, descricao } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (usuario_id) {
      const usuario = await getQuery('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuario nao encontrado' });
      }

      const jaVinculado = await getQuery('SELECT id FROM prestadores WHERE usuario_id = ? AND id != ?', [usuario_id, parseInt(id)]);
      if (jaVinculado) {
        return res.status(409).json({ erro: 'Este usuario ja esta vinculado a outro prestador' });
      }

      updates.push('usuario_id = ?');
      values.push(usuario_id);
    }

    if (descricao !== undefined) {
      updates.push('descricao = ?');
      values.push(descricao);
    }

    if (updates.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    values.push(parseInt(id));

    const result = await runQuery(`UPDATE prestadores SET ${updates.join(', ')} WHERE id = ?`, values);
    if (result.changes === 0) {
      return res.status(404).json({ erro: 'Prestador nao encontrado' });
    }

    const prestadorAtualizado = await getQuery(
      `
      SELECT
        p.id,
        p.usuario_id,
        p.descricao,
        p.criado_em,
        u.nome AS usuario_nome,
        u.email AS usuario_email
      FROM prestadores p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
      `,
      [parseInt(id)]
    );

    return res.json({ sucesso: true, mensagem: 'Prestador atualizado com sucesso', dados: prestadorAtualizado });
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar prestador' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const prestador = await getQuery('SELECT usuario_id FROM prestadores WHERE id = ?', [parseInt(id)]);
    const result = await runQuery('DELETE FROM prestadores WHERE id = ?', [parseInt(id)]);

    if (result.changes === 0) {
      return res.status(404).json({ erro: 'Prestador nao encontrado' });
    }

    if (prestador?.usuario_id) {
      await runQuery('UPDATE usuarios SET role = ?, prestador_status = ? WHERE id = ?', ['usuario', 'nenhum', prestador.usuario_id]);
    }

    return res.json({ sucesso: true, mensagem: 'Prestador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar prestador:', error);
    return res.status(500).json({ erro: 'Erro ao deletar prestador' });
  }
});

export default router;
