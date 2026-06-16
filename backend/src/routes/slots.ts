import { Router } from 'express';
import { getQuery, runQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /slots?prestador_id=X — lista slots disponíveis de um prestador
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { prestador_id } = req.query;

    if (!prestador_id) {
      return res.status(400).json({ erro: 'prestador_id é obrigatório' });
    }

    const slots = await allQuery(
      `SELECT s.*, p.usuario_id
       FROM slots s
       INNER JOIN prestadores p ON p.id = s.prestador_id
       WHERE s.prestador_id = ? AND s.disponivel = 1
         AND s.data_hora > datetime('now')
       ORDER BY s.data_hora ASC`,
      [parseInt(prestador_id as string)]
    );

    return res.json({ sucesso: true, total: slots.length, dados: slots });
  } catch (error) {
    console.error('Erro ao listar slots:', error);
    return res.status(500).json({ erro: 'Erro ao listar slots' });
  }
});

// GET /slots/meus — prestador lista seus próprios slots
router.get('/meus', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const prestador = await getQuery(
      'SELECT id FROM prestadores WHERE usuario_id = ?',
      [req.user!.id]
    );

    if (!prestador) {
      return res.status(404).json({ erro: 'Perfil de prestador não encontrado' });
    }

    const slots = await allQuery(
      `SELECT * FROM slots WHERE prestador_id = ? ORDER BY data_hora ASC`,
      [prestador.id]
    );

    return res.json({ sucesso: true, total: slots.length, dados: slots });
  } catch (error) {
    console.error('Erro ao listar meus slots:', error);
    return res.status(500).json({ erro: 'Erro ao listar slots' });
  }
});

// POST /slots — prestador cria um slot de disponibilidade
router.post('/', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data_hora, duracao_minutos } = req.body as {
      data_hora?: string;
      duracao_minutos?: number;
    };

    if (!data_hora) {
      return res.status(400).json({ erro: 'data_hora é obrigatório (formato ISO: 2024-06-15T14:00:00)' });
    }

    const prestador = await getQuery(
      'SELECT id FROM prestadores WHERE usuario_id = ?',
      [req.user!.id]
    );

    if (!prestador) {
      return res.status(403).json({ erro: 'Você não tem perfil de prestador' });
    }

    // Verifica conflito de horário
    const conflito = await getQuery(
      `SELECT id FROM slots
       WHERE prestador_id = ? AND data_hora = ? AND disponivel = 1`,
      [prestador.id, data_hora]
    );

    if (conflito) {
      return res.status(409).json({ erro: 'Já existe um slot nesse horário' });
    }

    const result = await runQuery(
      'INSERT INTO slots (prestador_id, data_hora, duracao_minutos) VALUES (?, ?, ?)',
      [prestador.id, data_hora, duracao_minutos || 60]
    );

    const novoSlot = await getQuery('SELECT * FROM slots WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Slot criado com sucesso',
      dados: novoSlot,
    });
  } catch (error) {
    console.error('Erro ao criar slot:', error);
    return res.status(500).json({ erro: 'Erro ao criar slot' });
  }
});

// DELETE /slots/:id — prestador remove um slot
router.delete('/:id', requireAuth, requireRole('prestador', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const slot = await getQuery(
      `SELECT s.id, p.usuario_id
       FROM slots s
       INNER JOIN prestadores p ON p.id = s.prestador_id
       WHERE s.id = ?`,
      [parseInt(id)]
    );

    if (!slot) {
      return res.status(404).json({ erro: 'Slot não encontrado' });
    }

    if (req.user!.role !== 'admin' && slot.usuario_id !== req.user!.id) {
      return res.status(403).json({ erro: 'Você só pode remover seus próprios slots' });
    }

    await runQuery('DELETE FROM slots WHERE id = ?', [parseInt(id)]);

    return res.json({ sucesso: true, mensagem: 'Slot removido' });
  } catch (error) {
    console.error('Erro ao remover slot:', error);
    return res.status(500).json({ erro: 'Erro ao remover slot' });
  }
});

export default router;
