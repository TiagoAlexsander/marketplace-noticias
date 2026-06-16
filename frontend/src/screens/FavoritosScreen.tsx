import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import { listarFavoritos, removerFavorito, FavoritoItem } from '../services/favoritos';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

const FavoritosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await listarFavoritos();
      setFavoritos(lista);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleRemover = (servicoId: number, nome: string) => {
    Alert.alert(
      'Remover favorito?',
      `Deseja remover "${nome}" dos seus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerFavorito(servicoId);
              setFavoritos((prev) => prev.filter((f) => f.id !== servicoId));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o favorito');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Favoritos</Text>
        <Text style={s.subheading}>Serviços salvos para acesso rápido</Text>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 20 }} />}

        {/* Estado vazio */}
        {!loading && favoritos.length === 0 && (
          <View style={s.emptyBox}>
            <View style={s.emptyIcon}>
              <Text style={s.emptyIconTxt}>🔖</Text>
            </View>
            <Text style={s.emptyTitle}>Nenhum favorito salvo</Text>
            <Text style={s.emptyDesc}>Ao buscar serviços, toque em ♡ para salvar aqui.</Text>
            <TouchableOpacity
              style={s.buscarBtn}
              onPress={() => navigation.navigate('RequisitarServico')}
              activeOpacity={0.8}
            >
              <Text style={s.buscarTxt}>BUSCAR SERVIÇOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {favoritos.map((f) => (
            <View key={f.favorito_id} style={s.card}>
              {/* Linha superior colorida */}
              <View style={s.cardAccent} />

              <View style={s.cardBody}>
                {/* Nome + botão remover */}
                <View style={s.cardTop}>
                  <Text style={s.cardNome} numberOfLines={2}>{f.nome}</Text>
                  <TouchableOpacity
                    style={s.removerBtn}
                    onPress={() => handleRemover(f.id, f.nome)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.removerTxt}>♡</Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.cardPrestador}>👤 {f.prestador_nome || 'Prestador'}</Text>

                {f.descricao ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{f.descricao}</Text>
                ) : null}

                {/* Rodapé do card: preço + ação */}
                <View style={s.cardFooter}>
                  <Text style={s.cardPreco}>R$ {Number(f.preco).toFixed(2)}</Text>
                  <TouchableOpacity
                    style={s.contratarBtn}
                    onPress={() => navigation.navigate('RequisitarServico', { servicoId: f.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={s.contratarTxt}>CONTRATAR →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: C.bgDeep },
  content:    { padding: S.md, paddingTop: TOP_PADDING },
  back:       { marginBottom: 14 },
  backTxt:    { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading:    { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 20 },

  // Estado vazio
  emptyBox: { alignItems: 'center', marginTop: 48, gap: 14 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bdrBase,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyIconTxt: { fontSize: 34 },
  emptyTitle: { color: C.mHigh, fontSize: 16, fontWeight: '700' },
  emptyDesc:  { color: C.mLow, fontSize: 13, textAlign: 'center', maxWidth: 240 },
  buscarBtn: {
    backgroundColor: C.blue, borderRadius: R.sm, borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 12, paddingHorizontal: 24, minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
  },
  buscarTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },

  // Cards
  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  cardAccent: { height: 2, backgroundColor: C.blue, opacity: 0.7 },
  cardBody:   { padding: S.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardNome:   { color: C.mHigh, fontSize: 15, fontWeight: '700', flex: 1 },
  removerBtn: {
    backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  removerTxt: { color: C.red, fontSize: 18 },

  cardPrestador: { color: C.mLow, fontSize: 12, marginBottom: 4 },
  cardDesc:   { color: C.mMid, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cardPreco:  { color: C.cyan, fontWeight: '800', fontSize: 15 },
  contratarBtn: {
    backgroundColor: C.bgCard2, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrAccent,
    paddingVertical: 8, paddingHorizontal: 14, minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  contratarTxt: { color: C.blueL, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
});

export default FavoritosScreen;
