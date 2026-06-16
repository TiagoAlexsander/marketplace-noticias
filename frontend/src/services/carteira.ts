import api from './api';

export interface Transacao {
  id: number;
  tipo: 'credito' | 'debito';
  valor: number;
  descricao: string;
  pedido_id?: number;
  criado_em: string;
}

export interface CarteiraData {
  saldo: number;
  transacoes: Transacao[];
}

export const getCarteira = async (): Promise<CarteiraData> => {
  const res = await api.get('/carteira');
  return res.data.dados;
};

export const creditarCarteira = async (valor: number): Promise<{ saldo: number; mensagem: string }> => {
  const res = await api.post('/carteira/creditar', { valor });
  return { saldo: res.data.dados.saldo, mensagem: res.data.mensagem };
};
