import api from './api';

export type Pedido = {
  id: number;
  servico_id: number;
  contratante_id: number;
  prestador_id: number | null;
  status: string;
  payment_status: string;
  contratante_confirmed: number;
  prestador_confirmed: number;
  criado_em: string;
};

export const createPedido = async (
  servicoId: number,
  mensagem?: string,
  slot_id?: number,
  endereco_id?: number,
  tipo_local?: 'endereco_usuario' | 'local_prestador',
) => {
  const res = await api.post('/pedidos', {
    servico_id: servicoId,
    mensagem,
    slot_id,
    endereco_id,
    tipo_local: tipo_local || 'endereco_usuario',
  });
  return res.data;
};

export const getPedidos = async () => {
  const res = await api.get('/pedidos/minhas');
  return res.data.dados as Pedido[];
};

export const getPedidosForContratante = async () => {
  const res = await api.get('/pedidos/minhas');
  return res.data.dados as Pedido[];
};

export const getPedidosForPrestador = async () => {
  const res = await api.get('/pedidos/minhas');
  return res.data.dados as Pedido[];
};

export const acceptPedido = async (pedidoId: number) => {
  const res = await api.post(`/pedidos/${pedidoId}/resposta`, { acao: 'aceitar' });
  return res.data;
};

export const declinePedido = async (pedidoId: number) => {
  const res = await api.post(`/pedidos/${pedidoId}/resposta`, { acao: 'recusar' });
  return res.data;
};

export const payPedido = async (pedidoId: number) => {
  const res = await api.post(`/pedidos/${pedidoId}/pagar`);
  return res.data;
};

export const confirmByContratante = async (pedidoId: number) => {
  const res = await api.post(`/pedidos/${pedidoId}/confirmar-finalizacao`);
  return res.data;
};

export const confirmByPrestador = async (pedidoId: number) => {
  const res = await api.post(`/pedidos/${pedidoId}/confirmar-finalizacao`);
  return res.data;
};

export default {
  createPedido,
  getPedidosForContratante,
  getPedidosForPrestador,
  acceptPedido,
  declinePedido,
  payPedido,
  confirmByContratante,
  confirmByPrestador,
};
