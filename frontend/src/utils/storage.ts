/**
 * Abstração de Storage
 * Usa AsyncStorage no React Native e localStorage no web
 */

let AsyncStorage: any;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // AsyncStorage não disponível no web
  AsyncStorage = null;
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Erro ao obter ${key} do storage:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Erro ao salvar ${key} no storage:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Erro ao remover ${key} do storage:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      if (AsyncStorage) {
        await AsyncStorage.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  },
};
