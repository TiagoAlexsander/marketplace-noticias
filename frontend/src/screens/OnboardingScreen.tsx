import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { C, R, S } from '../theme';
import { MIN_TOUCH_HEIGHT, TOP_PADDING } from '../utils/responsive';

const { width: SW } = Dimensions.get('window');

// Slides de apresentação
const SLIDES = [
  {
    icon: '⭐',
    title: 'Serviços de Qualidade',
    desc: 'Encontre profissionais verificados e confiáveis para qualquer necessidade.',
    accent: C.blue,
  },
  {
    icon: '💸',
    title: 'Preços Competitivos',
    desc: 'Compare orçamentos e escolha o serviço que cabe no seu bolso.',
    accent: C.cyan,
  },
  {
    icon: '🔒',
    title: 'Pagamento Seguro',
    desc: 'Sua carteira digital protegida — pague somente quando o prestador aceitar.',
    accent: C.green,
  },
];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [slideAtual, setSlideAtual] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const irPara = (idx: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setSlideAtual(idx), 150);
  };

  const proximo = () => {
    if (slideAtual < SLIDES.length - 1) {
      irPara(slideAtual + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const slide = SLIDES[slideAtual];
  const isUltimo = slideAtual === SLIDES.length - 1;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageContent}>
      {/* Decoração de fundo */}
      <View style={[s.bgBlob, { backgroundColor: slide.accent + '10' }]} />

      <View style={s.content}>
        {/* Indicadores de progresso */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => irPara(i)}>
              <View style={[s.dot, i === slideAtual && { backgroundColor: slide.accent, width: 20 }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Ícone animado */}
        <Animated.View style={[s.iconBox, { borderColor: slide.accent + '55', opacity: fadeAnim }]}>
          <Text style={s.iconTxt}>{slide.icon}</Text>
          <View style={[s.iconGlow, { backgroundColor: slide.accent + '15' }]} />
        </Animated.View>

        {/* Texto */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={[s.slideTitle, { color: slide.accent }]}>{slide.title}</Text>
          <Text style={s.slideDesc}>{slide.desc}</Text>
        </Animated.View>

        {/* Linha divisória */}
        <View style={s.divider} />

        {/* Features resumidas */}
        <View style={s.featureRow}>
          {['Agenda online', 'Carteira digital', 'Favoritos'].map((f, i) => (
            <View key={i} style={s.featurePill}>
              <Text style={s.featureTxt}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Ações */}
        <TouchableOpacity
          style={[s.btnPrimary, { borderColor: slide.accent, backgroundColor: slide.accent + 'CC' }]}
          onPress={proximo}
          activeOpacity={0.8}
        >
          <Text style={s.btnPrimaryTxt}>
            {isUltimo ? 'COMEÇAR AGORA →' : 'PRÓXIMO →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSkip} onPress={() => navigation.navigate('Home')}>
          <Text style={s.btnSkipTxt}>Pular introdução</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bgDeep },
  pageContent: { flexGrow: 1 },
  bgBlob: {
    position: 'absolute', top: -60, right: -80,
    width: 320, height: 320, borderRadius: 160,
  },
  content: {
    flex: 1, padding: S.lg, paddingTop: TOP_PADDING + 20,
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row', gap: 6, marginBottom: 48, alignSelf: 'center',
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.mLow, transition: 'all 0.3s',
  },

  iconBox: {
    width: 110, height: 110, borderRadius: R.xl,
    borderWidth: 1,
    backgroundColor: C.bgCard,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    shadowColor: C.shadow, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  iconGlow: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65, opacity: 0.6,
  },
  iconTxt: { fontSize: 52 },

  slideTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' },
  slideDesc: {
    color: C.mMid, fontSize: 15, lineHeight: 22,
    textAlign: 'center', maxWidth: 280,
  },

  divider: { width: 80, height: 1, backgroundColor: C.bdrBase, marginVertical: 28 },

  featureRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 },
  featurePill: {
    backgroundColor: C.bgCard, borderRadius: R.full,
    paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.bdrBase,
  },
  featureTxt: { color: C.mMid, fontSize: 12 },

  btnPrimary: {
    width: SW - S.lg * 2, height: MIN_TOUCH_HEIGHT + 4,
    borderRadius: R.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: C.shadow, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnPrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },

  btnSkip: { paddingVertical: 12 },
  btnSkipTxt: { color: C.mLow, fontSize: 13 },
});

export default OnboardingScreen;
