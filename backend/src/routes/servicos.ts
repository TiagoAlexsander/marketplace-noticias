import { Router } from 'express';
import { getQuery, runQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Query reutilizável com todos os campos de serviço
const SERVICO_SELECT = `
  SELECT
    s.id,
    s.prestador_id,
    s.nome,
    s.descricao,
    s.preco,
    s.status,
    s.motivo,
    s.analisado_por,
    s.analisado_em,
    s.criado_em,
    p.usuario_id,
    p.descricao AS prestador_descricao,
    u.nome AS prestador_nome,
    u.email AS prestador_email
  FROM servicos s
  INNER JOIN prestadores p ON p.id = s.prestador_id
  INNER JOIN usuarios u ON u.id = p.usuario_id
`;

// Listar serviços — admin vê todos, demais só os aprovados
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = req.user!.role === 'admin';

    const servicos = await allQuery(
      `${SERVICO_SELECT}
      ${isAdmin ? '' : "WHERE s.status = 'aprovado'"}
      ORDER BY s.id DESC`
    );

    return res.json({
      sucesso: true,
      total: servicos.length,
      dados: servicos,
    });
  } catch (error) {
    console.error('Erro ao listar servicos:', error);
    return res.status(500).json({ erro: 'Erro ao listar servicos' });
  }
});

// Listar serviços pendentes — apenas admin
router.get('/pendentes', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const servicos = await allQuery(
      `${SERVICO_SELECT}
      WHERE s.status = 'pendente'
      ORDER BY s.id DESC`
    );

    return res.json({
      sucesso: true,
      total: servicos.length,
      dados: servicos,
    });
  } catch (error) {
    console.error('Erro ao listar servicos pendentes:', error);
    return res.status(500).json({ erro: 'Erro ao listar servicos pendentes' });
  }
});

// Aprovar serviço — apenas admin
router.post('/:id/aprovar', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const servico = await getQuery(
      'SELECT id, status FROM servicos WHERE id = ?',
      [parseInt(id)]
    );

    if (!servico) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    if (servico.status !== 'pendente') {
      return res.status(400).json({ erro: 'Somente servicos pendentes podem ser aprovados' });
    }

    await runQuery(
      `UPDATE servicos
       SET status = 'aprovado', motivo = NULL,
           analisado_por = ?, analisado_em = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user!.id, parseInt(id)]
    );

    const atualizado = await getQuery(`${SERVICO_SELECT} WHERE s.id = ?`, [parseInt(id)]);

    return res.json({
      sucesso: true,
      mensagem: 'Servico aprovado com sucesso',
      dados: atualizado,
    });
  } catch (error) {
    console.error('Erro ao aprovar servico:', error);
    return res.status(500).json({ erro: 'Erro ao aprovar servico' });
  }
});

// Rejeitar serviço — apenas admin
router.post('/:id/rejeitar', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body as { motivo?: string };

    const servico = await getQuery(
      'SELECT id, status FROM servicos WHERE id = ?',
      [parseInt(id)]
    );

    if (!servico) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    if (servico.status !== 'pendente') {
      return res.status(400).json({ erro: 'Somente servicos pendentes podem ser rejeitados' });
    }

    await runQuery(
      `UPDATE servicos
       SET status = 'rejeitado', motivo = ?,
           analisado_por = ?, analisado_em = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [motivo || null, req.user!.id, parseInt(id)]
    );

    const atualizado = await getQuery(`${SERVICO_SELECT} WHERE s.id = ?`, [parseInt(id)]);

    return res.json({
      sucesso: true,
      mensagem: 'Servico rejeitado',
      dados: atualizado,
    });
  } catch (error) {
    console.error('Erro ao rejeitar servico:', error);
    return res.status(500).json({ erro: 'Erro ao rejeitar servico' });
  }
});

// Criar serviço — prestador cria como pendente, admin cria como aprovado
router.post('/', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { prestador_id, nome, descricao, preco } = req.body;

    if (!nome || !preco) {
      return res.status(400).json({ erro: 'nome e preco sao obrigatorios' });
    }

    let finalPrestadorId = prestador_id;

    if (req.user!.role === 'prestador') {
      const meuPrestador = await getQuery('SELECT id FROM prestadores WHERE usuario_id = ?', [req.user!.id]);
      if (!meuPrestador) {
        return res.status(403).json({ erro: 'Seu perfil de prestador ainda nao foi aprovado' });
      }
      finalPrestadorId = meuPrestador.id;
    }

    if (!finalPrestadorId) {
      return res.status(400).json({ erro: 'prestador_id e obrigatorio para admin' });
    }

    const prestador = await getQuery('SELECT id FROM prestadores WHERE id = ?', [finalPrestadorId]);
    if (!prestador) {
      return res.status(404).json({ erro: 'Prestador nao encontrado' });
    }

    // Admin cria aprovado direto; prestador envia para análise
    const statusInicial = req.user!.role === 'admin' ? 'aprovado' : 'pendente';

    const result = await runQuery(
      'INSERT INTO servicos (prestador_id, nome, descricao, preco, status) VALUES (?, ?, ?, ?, ?)',
      [finalPrestadorId, nome, descricao || null, parseFloat(preco), statusInicial]
    );

    const novoServico = await getQuery(`${SERVICO_SELECT} WHERE s.id = ?`, [result.lastID]);

    const mensagem = statusInicial === 'pendente'
      ? 'Servico enviado para aprovacao do administrador'
      : 'Servico criado e aprovado com sucesso';

    return res.status(201).json({
      sucesso: true,
      mensagem,
      dados: novoServico,
    });
  } catch (error) {
    console.error('Erro ao criar servico:', error);
    return res.status(500).json({ erro: 'Erro ao criar servico' });
  }
});

// Buscar serviço por ID
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin';

    const servico = await getQuery(
      `${SERVICO_SELECT}
      WHERE s.id = ?
      ${isAdmin ? '' : "AND s.status = 'aprovado'"}`,
      [parseInt(id)]
    );

    if (!servico) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    return res.json({ sucesso: true, dados: servico });
  } catch (error) {
    console.error('Erro ao buscar servico:', error);
    return res.status(500).json({ erro: 'Erro ao buscar servico' });
  }
});

// Atualizar serviço — ao editar volta para pendente (exceto admin)
router.put('/:id', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, prestador_id } = req.body;

    const servicoAtual = await getQuery(
      `SELECT s.id, s.prestador_id, p.usuario_id
       FROM servicos s
       INNER JOIN prestadores p ON p.id = s.prestador_id
       WHERE s.id = ?`,
      [parseInt(id)]
    );

    if (!servicoAtual) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    if (req.user!.role === 'prestador' && servicoAtual.usuario_id !== req.user!.id) {
      return res.status(403).json({ erro: 'Voce so pode editar seus proprios servicos' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }

    if (descricao !== undefined) {
      updates.push('descricao = ?');
      values.push(descricao);
    }

    if (preco !== undefined) {
      updates.push('preco = ?');
      values.push(parseFloat(preco));
    }

    if (prestador_id && req.user!.role === 'admin') {
      const prestador = await getQuery('SELECT id FROM prestadores WHERE id = ?', [prestador_id]);
      if (!prestador) {
        return res.status(404).json({ erro: 'Prestador nao encontrado' });
      }
      updates.push('prestador_id = ?');
      values.push(prestador_id);
    }

    // Prestador que edita volta o serviço para análise; admin mantém aprovado
    if (req.user!.role === 'prestador') {
      updates.push("status = 'pendente'");
      updates.push('motivo = NULL');
      updates.push('analisado_por = NULL');
      updates.push('analisado_em = NULL');
    }

    if (updates.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    values.push(parseInt(id));
    await runQuery(`UPDATE servicos SET ${updates.join(', ')} WHERE id = ?`, values);

    const servicoAtualizado = await getQuery(`${SERVICO_SELECT} WHERE s.id = ?`, [parseInt(id)]);

    const mensagem = req.user!.role === 'prestador'
      ? 'Servico atualizado e reenviado para aprovacao'
      : 'Servico atualizado com sucesso';

    return res.json({
      sucesso: true,
      mensagem,
      dados: servicoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar servico:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar servico' });
  }
});

// Deletar serviço
router.delete('/:id', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const servicoAtual = await getQuery(
      `SELECT s.id, p.usuario_id
       FROM servicos s
       INNER JOIN prestadores p ON p.id = s.prestador_id
       WHERE s.id = ?`,
      [parseInt(id)]
    );

    if (!servicoAtual) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    if (req.user!.role === 'prestador' && servicoAtual.usuario_id !== req.user!.id) {
      return res.status(403).json({ erro: 'Voce so pode deletar seus proprios servicos' });
    }

    await runQuery('DELETE FROM servicos WHERE id = ?', [parseInt(id)]);

    return res.json({
      sucesso: true,
      mensagem: 'Servico deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar servico:', error);
    return res.status(500).json({ erro: 'Erro ao deletar servico' });
  }
});

export default router;
