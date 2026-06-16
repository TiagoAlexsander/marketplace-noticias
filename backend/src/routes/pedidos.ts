import { Router } from 'express';
import { allQuery, getQuery, runQuery } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { garantirCarteira } from './carteira';

const router = Router();

const getPedidoDetalhado = async (pedidoId: number) => {
  return getQuery(
    `
    SELECT
      p.id,
      p.servico_id,
      p.contratante_id,
      p.prestador_id,
      p.valor,
      p.mensagem,
      p.status,
      p.slot_id,
      p.endereco_id,
      p.tipo_local,
      p.confirmado_contratante,
      p.confirmado_prestador,
      p.aceito_em,
      p.recusado_em,
      p.pago_em,
      p.concluido_em,
      p.expirado_em,
      p.criado_em,
      s.nome AS servico_nome,
      s.preco AS servico_preco,
      pr.usuario_id AS prestador_usuario_id,
      up.nome AS prestador_nome,
      up.email AS prestador_email,
      uc.nome AS contratante_nome,
      uc.email AS contratante_email,
      sl.data_hora AS slot_data_hora,
      sl.duracao_minutos AS slot_duracao,
      e.logradouro AS end_logradouro,
      e.numero AS end_numero,
      e.bairro AS end_bairro,
      e.cidade AS end_cidade,
      e.estado AS end_estado,
      e.label AS end_label
    FROM pedidos p
    INNER JOIN servicos s ON s.id = p.servico_id
    INNER JOIN prestadores pr ON pr.id = p.prestador_id
    INNER JOIN usuarios up ON up.id = pr.usuario_id
    INNER JOIN usuarios uc ON uc.id = p.contratante_id
    LEFT JOIN slots sl ON sl.id = p.slot_id
    LEFT JOIN enderecos e ON e.id = p.endereco_id
    WHERE p.id = ?
    `,
    [pedidoId]
  );
};

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { servico_id, mensagem, slot_id, endereco_id, tipo_local } = req.body as {
      servico_id?: number;
      mensagem?: string;
      slot_id?: number;
      endereco_id?: number;
      tipo_local?: string;
    };

    if (!servico_id) {
      return res.status(400).json({ erro: 'servico_id e obrigatorio' });
    }

    const servico = await getQuery(
      `
      SELECT s.id, s.preco, p.id AS prestador_id, p.usuario_id
      FROM servicos s
      INNER JOIN prestadores p ON p.id = s.prestador_id
      WHERE s.id = ?
      `,
      [servico_id]
    );

    if (!servico) {
      return res.status(404).json({ erro: 'Servico nao encontrado' });
    }

    if (servico.usuario_id === req.user!.id) {
      return res.status(400).json({ erro: 'Prestador nao pode abrir pedido para o proprio servico' });
    }

    // Se escolheu um slot, verifica se está disponível e marca como ocupado
    if (slot_id) {
      const slot = await getQuery(
        'SELECT id, disponivel, prestador_id FROM slots WHERE id = ? AND disponivel = 1',
        [slot_id]
      );
      if (!slot) {
        return res.status(400).json({ erro: 'Slot selecionado não está mais disponível' });
      }
      if (slot.prestador_id !== servico.prestador_id) {
        return res.status(400).json({ erro: 'Slot não pertence ao prestador deste serviço' });
      }
      await runQuery('UPDATE slots SET disponivel = 0 WHERE id = ?', [slot_id]);
    }

    const result = await runQuery(
      `INSERT INTO pedidos
       (servico_id, contratante_id, prestador_id, valor, mensagem, status, slot_id, endereco_id, tipo_local)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [servico_id, req.user!.id, servico.prestador_id, servico.preco, mensagem || null,
       'pendente', slot_id || null, endereco_id || null, tipo_local || 'endereco_usuario']
    );

    const pedido = await getPedidoDetalhado(result.lastID);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido enviado para fila de analise do prestador',
      dados: pedido,
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
});

router.get('/minhas', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const whereAdmin = req.user!.role === 'admin';

    const pedidos = await allQuery(
      `
      SELECT
        p.id,
        p.servico_id,
        p.contratante_id,
        p.prestador_id,
        p.valor,
        p.mensagem,
        p.status,
        p.slot_id,
        p.endereco_id,
        p.tipo_local,
        p.confirmado_contratante,
        p.confirmado_prestador,
        p.aceito_em,
        p.recusado_em,
        p.pago_em,
        p.concluido_em,
        p.expirado_em,
        p.criado_em,
        s.nome AS servico_nome,
        pr.usuario_id AS prestador_usuario_id,
        up.nome AS prestador_nome,
        uc.nome AS contratante_nome,
        sl.data_hora AS slot_data_hora,
        sl.duracao_minutos AS slot_duracao,
        e.logradouro AS end_logradouro,
        e.numero AS end_numero,
        e.cidade AS end_cidade,
        e.estado AS end_estado,
        e.label AS end_label
      FROM pedidos p
      INNER JOIN servicos s ON s.id = p.servico_id
      INNER JOIN prestadores pr ON pr.id = p.prestador_id
      INNER JOIN usuarios up ON up.id = pr.usuario_id
      INNER JOIN usuarios uc ON uc.id = p.contratante_id
      LEFT JOIN slots sl ON sl.id = p.slot_id
      LEFT JOIN enderecos e ON e.id = p.endereco_id
      ${whereAdmin ? '' : 'WHERE p.contratante_id = ? OR pr.usuario_id = ?'}
      ORDER BY p.id DESC
      `,
      whereAdmin ? [] : [req.user!.id, req.user!.id]
    );

    return res.json({
      sucesso: true,
      total: pedidos.length,
      dados: pedidos,
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
});

router.post('/:id/resposta', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { acao } = req.body as { acao?: 'aceitar' | 'recusar' };

    if (!acao || !['aceitar', 'recusar'].includes(acao)) {
      return res.status(400).json({ erro: 'acao deve ser aceitar ou recusar' });
    }

    const pedido = await getPedidoDetalhado(parseInt(id));
    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    const isPrestadorDono = pedido.prestador_usuario_id === req.user!.id;
    if (!isPrestadorDono && req.user!.role !== 'admin') {
      return res.status(403).json({ erro: 'Apenas o prestador responsavel pode responder o pedido' });
    }

    if (pedido.status !== 'pendente') {
      return res.status(400).json({ erro: 'Somente pedidos pendentes podem ser respondidos' });
    }

    if (acao === 'aceitar') {
      await runQuery('UPDATE pedidos SET status = ?, aceito_em = CURRENT_TIMESTAMP WHERE id = ?', ['aceito', parseInt(id)]);
    } else {
      await runQuery('UPDATE pedidos SET status = ?, recusado_em = CURRENT_TIMESTAMP WHERE id = ?', ['recusado', parseInt(id)]);
    }

    const atualizado = await getPedidoDetalhado(parseInt(id));

    return res.json({
      sucesso: true,
      mensagem: `Pedido ${acao === 'aceitar' ? 'aceito' : 'recusado'} com sucesso`,
      dados: atualizado,
    });
  } catch (error) {
    console.error('Erro ao responder pedido:', error);
    return res.status(500).json({ erro: 'Erro ao responder pedido' });
  }
});

router.post('/:id/pagar', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const pedido = await getPedidoDetalhado(parseInt(id));
    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    if (pedido.contratante_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ erro: 'Apenas o contratante pode registrar pagamento' });
    }

    if (pedido.status !== 'aceito') {
      return res.status(400).json({ erro: 'Somente pedidos aceitos podem ir para pagamento' });
    }

    // Débita da carteira do contratante
    const carteiraId = await garantirCarteira(pedido.contratante_id);
    const carteira = await getQuery('SELECT saldo FROM carteiras WHERE id = ?', [carteiraId]);

    if ((carteira?.saldo ?? 0) < pedido.valor) {
      return res.status(400).json({
        erro: `Saldo insuficiente. Seu saldo: R$ ${(carteira?.saldo ?? 0).toFixed(2)}. Necessário: R$ ${pedido.valor.toFixed(2)}`,
      });
    }

    await runQuery(
      'UPDATE carteiras SET saldo = saldo - ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [pedido.valor, carteiraId]
    );

    await runQuery(
      `INSERT INTO transacoes (carteira_id, tipo, valor, descricao, pedido_id)
       VALUES (?, 'debito', ?, ?, ?)`,
      [carteiraId, pedido.valor, `Pagamento do pedido #${id} - ${pedido.servico_nome}`, parseInt(id)]
    );

    await runQuery('UPDATE pedidos SET status = ?, pago_em = CURRENT_TIMESTAMP WHERE id = ?', ['em_andamento', parseInt(id)]);

    const atualizado = await getPedidoDetalhado(parseInt(id));

    return res.json({
      sucesso: true,
      mensagem: 'Pagamento registrado e pedido em andamento',
      dados: atualizado,
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return res.status(500).json({ erro: 'Erro ao registrar pagamento' });
  }
});

router.post('/:id/confirmar-finalizacao', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const pedido = await getPedidoDetalhado(parseInt(id));
    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido nao encontrado' });
    }

    const isContratante = pedido.contratante_id === req.user!.id;
    const isPrestador = pedido.prestador_usuario_id === req.user!.id;

    if (!isContratante && !isPrestador && req.user!.role !== 'admin') {
      return res.status(403).json({ erro: 'Somente prestador ou contratante podem confirmar finalizacao' });
    }

    if (!['em_andamento', 'aguardando_confirmacao'].includes(pedido.status)) {
      return res.status(400).json({ erro: 'Pedido nao esta em estado de finalizacao' });
    }

    if (isContratante) {
      await runQuery('UPDATE pedidos SET confirmado_contratante = 1 WHERE id = ?', [parseInt(id)]);
    }

    if (isPrestador) {
      await runQuery('UPDATE pedidos SET confirmado_prestador = 1 WHERE id = ?', [parseInt(id)]);
    }

    const atualizado = await getPedidoDetalhado(parseInt(id));

    if (atualizado.confirmado_contratante && atualizado.confirmado_prestador) {
      await runQuery(
        'UPDATE pedidos SET status = ?, concluido_em = CURRENT_TIMESTAMP, expirado_em = CURRENT_TIMESTAMP WHERE id = ?',
        ['expirado', parseInt(id)]
      );

      const expirado = await getPedidoDetalhado(parseInt(id));
      return res.json({
        sucesso: true,
        mensagem: 'Pedido concluido por ambas as partes e expirado com sucesso',
        dados: expirado,
      });
    }

    await runQuery('UPDATE pedidos SET status = ? WHERE id = ?', ['aguardando_confirmacao', parseInt(id)]);
    const aguardando = await getPedidoDetalhado(parseInt(id));

    return res.json({
      sucesso: true,
      mensagem: 'Confirmacao registrada. Aguardando a outra parte para expirar o pedido',
      dados: aguardando,
    });
  } catch (error) {
    console.error('Erro ao confirmar finalizacao:', error);
    return res.status(500).json({ erro: 'Erro ao confirmar finalizacao' });
  }
});

export default router;
