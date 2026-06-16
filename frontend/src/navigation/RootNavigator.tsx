import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Importar telas
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import PrestadoresScreen from '../screens/PrestadoresScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import ServicosScreen from '../screens/ServicosScreen';
import AdminPrestadoresScreen from '../screens/AdminPrestadoresScreen';
import ContratantePedidosScreen from '../screens/ContratantePedidosScreen';
import PrestadorPedidosScreen from '../screens/PrestadorPedidosScreen';
import RequisitarServicoScreen from '../screens/RequisitarServicoScreen';
import AdminSolicitacoesScreen from '../screens/AdminSolicitacoesScreen';
import AdminServicosScreen from '../screens/AdminServicosScreen';
import CarteiraScreen from '../screens/CarteiraScreen';
import SlotsScreen from '../screens/SlotsScreen';
import EnderecosScreen from '../screens/EnderecosScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import LoginScreen from '../screens/LoginScreen';
import CadastroScreen from '../screens/CadastroScreen';
import RecuperarSenhaScreen from '../screens/RecuperarSenhaScreen';

import { AuthContext } from '../context/AuthContext';

// Tipos de navegação
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  Prestadores: undefined;
  AdminPrestadores: undefined;
  Usuarios: undefined;
  Servicos: undefined;
  RequisitarServico: { servicoId?: number } | undefined;
  AdminSolicitacoes: undefined;
  AdminServicos: undefined;
  ContratantePedidos: undefined;
  PrestadorPedidos: undefined;
  Carteira: undefined;
  Slots: undefined;
  Enderecos: undefined;
  Favoritos: undefined;
  EditarPerfil: undefined;
  Login: undefined;
  Cadastro: undefined;
  RecuperarSenha: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#061D3B' } }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Cadastro" component={CadastroScreen} />
    <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#061D3B' } }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Prestadores" component={PrestadoresScreen} />
    <Stack.Screen name="Usuarios" component={UsuariosScreen} />
    <Stack.Screen name="Servicos" component={ServicosScreen} />
    <Stack.Screen name="RequisitarServico" component={RequisitarServicoScreen} />
    <Stack.Screen name="AdminSolicitacoes" component={AdminSolicitacoesScreen} />
    <Stack.Screen name="AdminServicos" component={AdminServicosScreen} />
    <Stack.Screen name="AdminPrestadores" component={AdminPrestadoresScreen} />
    <Stack.Screen name="ContratantePedidos" component={ContratantePedidosScreen} />
    <Stack.Screen name="PrestadorPedidos" component={PrestadorPedidosScreen} />
    <Stack.Screen name="Carteira" component={CarteiraScreen} />
    <Stack.Screen name="Slots" component={SlotsScreen} />
    <Stack.Screen name="Enderecos" component={EnderecosScreen} />
    <Stack.Screen name="Favoritos" component={FavoritosScreen} />
    <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
  </Stack.Navigator>
);

/**
 * Navegação Principal
 * Exibe stacks diferentes dependendo do estado de autenticação
 */
export const RootNavigator: React.FC = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
