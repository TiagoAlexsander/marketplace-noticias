import api from './api';

export interface UsuarioItem {
  id: number;
  nome: string;
  email: string;
}

export interface UsuariosResponse {
  sucesso: boolean;
  total: number;
  dados: UsuarioItem[];
}

export const listarUsuarios = async (): Promise<UsuarioItem[]> => {
  const response = await api.get<UsuariosResponse>('/usuarios');
  return response.data.dados;
};

export const criarUsuario = async (data: {
  nome: string;
  email: string;
}): Promise<UsuarioItem> => {
  const response = await api.post('/usuarios', data);
  return response.data.dados;
};

export const atualizarUsuario = async (
  id: number,
  data: { nome?: string; email?: string }
): Promise<UsuarioItem> => {
  const response = await api.put(`/usuarios/${id}`, data);
  return response.data.dados;
};

export const removerUsuario = async (id: number): Promise<void> => {
  await api.delete(`/usuarios/${id}`);
};
