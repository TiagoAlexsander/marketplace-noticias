import api from './api';

export interface SolicitacaoPrestador {
  id: number;
  usuario_id: number;
  nome: string;
  email: string;
  descricao: string | null;
  status: 'pendente' | 'aprovado' | 'recusado';
  motivo?: string;
  criado_em: string;
}

export const listarSolicitacoes = async (): Promise<SolicitacaoPrestador[]> => {
  const response = await api.get('/prestadores/solicitacoes');
  return response.data.dados;
};

export const solicitarSerPrestador = async (descricao?: string): Promise<any> => {
  const response = await api.post('/prestadores/solicitar', { descricao });
  return response.data;
};

export const aprovarSolicitacao = async (solicitacaoId: number): Promise<any> => {
  const response = await api.post(`/prestadores/solicitacoes/${solicitacaoId}/aprovar`);
  return response.data;
};

export const rejeitarSolicitacao = async (
  solicitacaoId: number,
  motivo: string
): Promise<any> => {
  const response = await api.post(
    `/prestadores/solicitacoes/${solicitacaoId}/rejeitar`,
    { motivo }
  );
  return response.data;
};

export default {
  listarSolicitacoes,
  solicitarSerPrestador,
  aprovarSolicitacao,
  rejeitarSolicitacao,
};
