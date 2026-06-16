import api from './api';
import { ServicoItem } from './servicos';

export interface FavoritoItem extends ServicoItem {
  favorito_id: number;
  favoritado_em: string;
}

export const listarFavoritos = async (): Promise<FavoritoItem[]> => {
  const res = await api.get('/favoritos');
  return res.data.dados;
};

export const adicionarFavorito = async (servicoId: number): Promise<void> => {
  await api.post(`/favoritos/${servicoId}`);
};

export const removerFavorito = async (servicoId: number): Promise<void> => {
  await api.delete(`/favoritos/${servicoId}`);
};
