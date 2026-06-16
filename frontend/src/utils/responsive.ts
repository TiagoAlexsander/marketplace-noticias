import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Largura de referência: iPhone 14 (390px)
const BASE_WIDTH = 390;

/**
 * Escala uma medida proporcionalmente ao tamanho da tela.
 * Ex: scale(38) → 38 no iPhone 14, menor em telas menores, maior em tablets
 */
export const scale = (size: number): number => {
  const ratio = width / BASE_WIDTH;
  // Limita o crescimento em telas muito grandes (tablet/web)
  const bounded = Math.min(ratio, 1.3);
  return Math.round(size * bounded);
};

/**
 * Padding do topo levando em conta a barra de status de cada plataforma.
 * iOS tem notch, Android tem status bar menor, web não precisa de nada.
 */
export const TOP_PADDING = Platform.select({
  ios: 54,
  android: 28,
  web: 20,
  default: 20,
}) as number;

/**
 * Altura mínima de botão recomendada para toque (44px iOS, 48px Android)
 */
export const MIN_TOUCH_HEIGHT = Platform.select({
  ios: 44,
  android: 48,
  web: 44,
  default: 44,
}) as number;
