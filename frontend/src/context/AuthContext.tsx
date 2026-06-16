import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { login as apiLogin, logout as apiLogout, LoginRequest } from '../services/auth';
import api from '../services/api';

// Tipo completo do usuário logado
type User = {
  id: number;
  nome: string;
  email: string;
  role?: 'admin' | 'prestador' | 'usuario';
  prestador_status?: string;
  foto_url?: string | null;
  bio?: string | null;
};

type AuthContextProps = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  // Atualiza os dados do usuário no contexto buscando do servidor
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão salva ao abrir o app
  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await storage.getItem('auth_token');
        const storedUser = await storage.getItem('auth_user');
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn('Falha ao restaurar credenciais', e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // Busca dados atualizados do usuário no servidor e atualiza contexto + storage
  const refreshUser = async () => {
    try {
      const res = await api.get('/perfil');
      const dados = res.data.dados;
      const atualizado: User = {
        id: dados.id,
        nome: dados.nome,
        email: dados.email,
        role: dados.role,
        prestador_status: dados.prestador_status,
        foto_url: dados.foto_url || null,
        bio: dados.bio || null,
      };
      setUser(atualizado);
      await storage.setItem('auth_user', JSON.stringify(atualizado));
    } catch (e) {
      console.warn('Falha ao atualizar dados do usuário', e);
    }
  };

  const signIn = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const data = await apiLogin(credentials);
      const newToken = data.dados.token;
      const newUser = data.dados.usuario as User;
      await storage.setItem('auth_token', newToken);
      await storage.setItem('auth_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiLogout();
      await storage.removeItem('auth_token');
      await storage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
