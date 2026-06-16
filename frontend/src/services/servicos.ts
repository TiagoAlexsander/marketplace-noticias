import api from './api';

export interface ServicoItem {
  id: number;
  prestador_id: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivo?: string | null;
  usuario_id?: number;
  prestador_nome?: string;
  prestador_email?: string;
  prestador_descricao?: string | null;
  criado_em?: string;
}

export interface ServicosResponse {
  sucesso: boolean;
  total: number;
  dados: ServicoItem[];
}

// Listar serviços aprovados (usuário comum e prestador)
export const listarServicos = async (): Promise<ServicoItem[]> => {
  const response = await api.get<ServicosResponse>('/servicos');
  return response.data.dados;
};

// Listar serviços pendentes (admin)
export const listarServicosPendentes = async (): Promise<ServicoItem[]> => {
  const response = await api.get<ServicosResponse>('/servicos/pendentes');
  return response.data.dados;
};

export const criarServico = async (data: {
  prestador_id?: number;
  nome: string;
  descricao?: string;
  preco: number;
}): Promise<ServicoItem> => {
  const response = await api.post('/servicos', data);
  return response.data.dados;
};

export const atualizarServico = async (
  id: number,
  data: { prestador_id?: number; nome?: string; descricao?: string; preco?: number }
): Promise<ServicoItem> => {
  const response = await api.put(`/servicos/${id}`, data);
  return response.data.dados;
};

export const removerServico = async (id: number): Promise<void> => {
  await api.delete(`/servicos/${id}`);
};

// Aprovar serviço (admin)
export const aprovarServico = async (id: number): Promise<ServicoItem> => {
  const response = await api.post(`/servicos/${id}/aprovar`);
  return response.data.dados;
};

// Rejeitar serviço (admin)
export const rejeitarServico = async (id: number, motivo?: string): Promise<ServicoItem> => {
  const response = await api.post(`/servicos/${id}/rejeitar`, { motivo });
  return response.data.dados;
};
