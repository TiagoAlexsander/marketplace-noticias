import api from './api';
import { storage } from '../utils/storage';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface RecuperarSenhaRequest {
  email: string;
}

export interface LoginResponse {
  sucesso: boolean;
  dados: {
    token: string;
    usuario: {
      id: number;
      nome: string;
      email: string;
      role?: 'admin' | 'prestador' | 'usuario';
      prestador_status?: string;
    };
  };
}

export interface CadastroResponse {
  sucesso: boolean;
  mensagem: string;
  dados: {
    id: number;
    nome: string;
    email: string;
  };
}

/**
 * Fazer login
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  // Persistir token e usuário no storage para uso no app
  try {
    const token = response.data?.dados?.token;
    if (token) {
      await storage.setItem('auth_token', token);
      await storage.setItem('auth_user', JSON.stringify(response.data.dados.usuario));
    }
  } catch (e) {
    console.warn('Falha ao salvar credenciais localmente', e);
  }
  return response.data;
};

/**
 * Cadastrar novo usuário
 */
export const cadastro = async (data: CadastroRequest): Promise<CadastroResponse> => {
  const response = await api.post<CadastroResponse>('/usuarios', data);
  return response.data;
};

export const logout = async () => {
  try {
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
  } catch (e) {
    console.warn('Falha ao remover credenciais', e);
  }
};

/**
 * Recuperar senha
 */
export const recuperarSenha = async (
  data: RecuperarSenhaRequest
): Promise<{ sucesso: boolean; mensagem: string }> => {
  const response = await api.post<{ sucesso: boolean; mensagem: string }>(
    '/auth/recuperar-senha',
    data
  );
  return response.data;
};
