import React from 'react';
import { StatusBar } from 'react-native';
import * as SplashScreenLib from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';

// Manter a splash screen visível enquanto carregamos
SplashScreenLib.preventAutoHideAsync();

/**
 * App.tsx - Componente Raiz
 * Ponto de entrada principal da aplicação React Native
 */
export default function App() {
  React.useEffect(() => {
    // Esconder a splash screen do Expo após a navegação estar pronta
    SplashScreenLib.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#061D3B" />
      <RootNavigator />
    </AuthProvider>
  );
}
