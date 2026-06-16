import api from './api';

export interface PerfilData {
  id: number;
  nome: string;
  email: string;
  role: string;
  prestador_status: string;
  foto_url?: string | null;
  bio?: string | null;
  saldo: number;
  criado_em: string;
}

export const getPerfil = async (): Promise<PerfilData> => {
  const res = await api.get('/perfil');
  return res.data.dados;
};

export const atualizarPerfil = async (data: {
  nome?: string;
  bio?: string;
  foto_url?: string;
}): Promise<PerfilData> => {
  const res = await api.put('/perfil', data);
  return res.data.dados;
};
