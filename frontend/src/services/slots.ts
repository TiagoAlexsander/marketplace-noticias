import api from './api';

export interface Slot {
  id: number;
  prestador_id: number;
  data_hora: string;
  duracao_minutos: number;
  disponivel: number;
  criado_em: string;
}

export const listarSlots = async (prestadorId: number): Promise<Slot[]> => {
  const res = await api.get(`/slots?prestador_id=${prestadorId}`);
  return res.data.dados;
};

export const listarMeusSlots = async (): Promise<Slot[]> => {
  const res = await api.get('/slots/meus');
  return res.data.dados;
};

export const criarSlot = async (data_hora: string, duracao_minutos = 60): Promise<Slot> => {
  const res = await api.post('/slots', { data_hora, duracao_minutos });
  return res.data.dados;
};

export const removerSlot = async (id: number): Promise<void> => {
  await api.delete(`/slots/${id}`);
};
