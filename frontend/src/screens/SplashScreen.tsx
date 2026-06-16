import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C, R } from '../theme';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Animações de entrada
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo aparece
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Texto aparece
      Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Barra de progresso
      Animated.timing(barAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
    ]).start(() => {
      // Navega para Home após a animação
      navigation.replace('Home');
    });
  }, []);

  return (
    <View style={s.page}>
      {/* Pontos decorativos */}
      <View style={s.dotTopLeft} />
      <View style={s.dotBotRight} />

      <View style={s.center}>
        {/* Logo animado */}
        <Animated.View style={[s.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={s.logoChar}>U</Text>
          <View style={s.glowRing} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={s.appName}>UPSERV</Text>
          <Text style={s.tagline}>PLATAFORMA DE SERVIÇOS</Text>

          {/* Linha divisória */}
          <View style={s.divider} />

          {/* Barra de carregamento */}
          <View style={s.barContainer}>
            <Animated.View style={[s.barFill, {
              width: barAnim.interpolate({
                inputRange: [0, 1], outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>
          <Text style={s.loadingTxt}>INICIALIZANDO SISTEMA...</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  page: {
    flex: 1, backgroundColor: C.bgDeep,
    justifyContent: 'center', alignItems: 'center',
  },
  // Decorações de fundo
  dotTopLeft: {
    position: 'absolute', top: 60, left: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.blue, opacity: 0.04,
  },
  dotBotRight: {
    position: 'absolute', bottom: 60, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: C.cyan, opacity: 0.04,
  },

  center: { alignItems: 'center', gap: 20 },

  logoBox: {
    width: 80, height: 80, borderRadius: R.lg,
    backgroundColor: C.blue,
    borderWidth: 2, borderColor: C.blueL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.blue, shadowOpacity: 0.7, shadowRadius: 20, elevation: 12,
  },
  logoChar: { color: '#fff', fontSize: 44, fontWeight: '900' },
  glowRing: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, borderWidth: 1, borderColor: C.bdrGlow, opacity: 0.4,
  },

  appName: {
    color: C.mHigh, fontSize: 32, fontWeight: '900',
    letterSpacing: 6, marginTop: 4,
  },
  tagline: {
    color: C.mLow, fontSize: 10, letterSpacing: 3,
    marginTop: 4,
  },

  divider: {
    height: 1, width: 180, backgroundColor: C.bdrBase,
    marginVertical: 20,
  },

  barContainer: {
    width: 200, height: 3, backgroundColor: C.bgCard2,
    borderRadius: 2, overflow: 'hidden', marginBottom: 10,
  },
  barFill: {
    height: '100%', backgroundColor: C.cyan,
    borderRadius: 2,
    shadowColor: C.cyan, shadowOpacity: 0.8, shadowRadius: 4,
  },
  loadingTxt: {
    color: C.mLow, fontSize: 9, letterSpacing: 2,
  },
});

export default SplashScreen;
