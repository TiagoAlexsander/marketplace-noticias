import api from './api';

export interface Endereco {
  id: number;
  usuario_id: number;
  label: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  is_padrao: number;
  criado_em: string;
}

export const listarEnderecos = async (): Promise<Endereco[]> => {
  const res = await api.get('/enderecos');
  return res.data.dados;
};

export const criarEndereco = async (data: Partial<Endereco>): Promise<Endereco> => {
  const res = await api.post('/enderecos', data);
  return res.data.dados;
};

export const atualizarEndereco = async (id: number, data: Partial<Endereco>): Promise<Endereco> => {
  const res = await api.put(`/enderecos/${id}`, data);
  return res.data.dados;
};

export const removerEndereco = async (id: number): Promise<void> => {
  await api.delete(`/enderecos/${id}`);
};
