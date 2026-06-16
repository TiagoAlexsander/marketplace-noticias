import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const resolveApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  const constantsAny = Constants as any;
  const hostUri =
    constantsAny?.expoConfig?.hostUri ||
    constantsAny?.manifest2?.extra?.expoClient?.hostUri ||
    constantsAny?.manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  return 'http://127.0.0.1:3000';
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições (lê do storage)
api.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Não bloquear requisição por falha ao ler o storage
    console.warn('Não foi possível ler token do storage', e);
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.message || error);
    return Promise.reject(error);
  }
);

export default api;
