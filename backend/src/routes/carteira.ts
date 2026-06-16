import { Router } from 'express';
import { getQuery, runQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// Garante que o usuário tem carteira, criando se necessário
const garantirCarteira = async (usuarioId: number): Promise<number> => {
  let carteira = await getQuery('SELECT id, saldo FROM carteiras WHERE usuario_id = ?', [usuarioId]);
  if (!carteira) {
    const result = await runQuery(
      'INSERT INTO carteiras (usuario_id, saldo) VALUES (?, ?)',
      [usuarioId, 0]
    );
    return result.lastID;
  }
  return carteira.id;
};

// GET /carteira — saldo + histórico de transações
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const carteiraId = await garantirCarteira(req.user!.id);
    const carteira = await getQuery('SELECT * FROM carteiras WHERE id = ?', [carteiraId]);

    const transacoes = await allQuery(
      `SELECT * FROM transacoes WHERE carteira_id = ? ORDER BY id DESC LIMIT 50`,
      [carteiraId]
    );

    return res.json({
      sucesso: true,
      dados: {
        saldo: carteira.saldo,
        transacoes,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar carteira:', error);
    return res.status(500).json({ erro: 'Erro ao buscar carteira' });
  }
});

// POST /carteira/creditar — adiciona créditos fictícios
router.post('/creditar', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { valor } = req.body as { valor?: number };

    if (!valor || valor <= 0 || valor > 10000) {
      return res.status(400).json({ erro: 'Valor deve ser entre R$ 0,01 e R$ 10.000' });
    }

    const carteiraId = await garantirCarteira(req.user!.id);

    await runQuery(
      'UPDATE carteiras SET saldo = saldo + ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [valor, carteiraId]
    );

    await runQuery(
      `INSERT INTO transacoes (carteira_id, tipo, valor, descricao)
       VALUES (?, 'credito', ?, ?)`,
      [carteiraId, valor, `Recarga de R$ ${valor.toFixed(2)}`]
    );

    const carteira = await getQuery('SELECT saldo FROM carteiras WHERE id = ?', [carteiraId]);

    return res.json({
      sucesso: true,
      mensagem: `R$ ${valor.toFixed(2)} adicionado à sua carteira!`,
      dados: { saldo: carteira.saldo },
    });
  } catch (error) {
    console.error('Erro ao creditar:', error);
    return res.status(500).json({ erro: 'Erro ao adicionar créditos' });
  }
});

export default router;

// Exporta a função para usar nos pedidos
export { garantirCarteira };
