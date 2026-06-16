import api from './api';

export interface PrestadorItem {
  id: number;
  usuario_id: number;
  descricao: string | null;
  criado_em?: string;
  usuario_nome?: string;
  usuario_email?: string;
}

export interface PrestadoresResponse {
  sucesso: boolean;
  total: number;
  dados: PrestadorItem[];
}

export const listarPrestadores = async (): Promise<PrestadorItem[]> => {
  const response = await api.get<PrestadoresResponse>('/prestadores');
  return response.data.dados;
};

export const criarPrestador = async (data: {
  usuario_id: number;
  descricao?: string | null;
}): Promise<PrestadorItem> => {
  const response = await api.post('/prestadores', data);
  return response.data.dados;
};

export const atualizarPrestador = async (
  id: number,
  data: { usuario_id?: number; descricao?: string | null }
): Promise<PrestadorItem> => {
  const response = await api.put(`/prestadores/${id}`, data);
  return response.data.dados;
};

export const removerPrestador = async (id: number): Promise<void> => {
  await api.delete(`/prestadores/${id}`);
};
