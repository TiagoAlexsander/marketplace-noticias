import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, Animated,
} from 'react-native';
import { getCarteira, creditarCarteira, Transacao } from '../services/carteira';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT, scale } from '../utils/responsive';

const VALORES_RAPIDOS = [10, 25, 50, 100, 200];

const CarteiraScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [saldo, setSaldo] = useState(0);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorInput, setValorInput] = useState('');
  const [creditando, setCreditando] = useState(false);

  // Animações do card de saldo
  const saldoAnim = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await getCarteira();
      setSaldo(data.saldo);
      setTransacoes(data.transacoes);
      Animated.parallel([
        Animated.spring(saldoAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a carteira');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleCreditar = async (valor: number) => {
    if (!valor || valor <= 0) { Alert.alert('Atenção', 'Valor inválido'); return; }
    setCreditando(true);
    try {
      const res = await creditarCarteira(valor);
      setSaldo(res.saldo);
      setValorInput('');
      // Pulsa o card
      Animated.sequence([
        Animated.timing(saldoAnim, { toValue: 1.06, duration: 120, useNativeDriver: true }),
        Animated.spring(saldoAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
      Alert.alert('Créditos adicionados!', res.mensagem);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível adicionar créditos');
    } finally {
      setCreditando(false);
    }
  };

  return (
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Carteira</Text>
        <Text style={s.subheading}>Saldo fictício para pagamento de serviços</Text>

        {/* Card de saldo */}
        <Animated.View style={[s.saldoCard, { transform: [{ scale: saldoAnim }], opacity: cardOpacity }]}>
          <View style={s.saldoGlow} />
          <Text style={s.saldoLabel}>SALDO DISPONÍVEL</Text>
          <Text style={s.saldoValor}>
            R$ {saldo.toFixed(2).replace('.', ',')}
          </Text>
          <View style={s.saldoLine} />
          <Text style={s.saldoHint}>Carteira fictícia · uso exclusivo na plataforma</Text>
        </Animated.View>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 16 }} />}

        {/* Adicionar créditos */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ADICIONAR CRÉDITOS</Text>

          {/* Botões rápidos */}
          <View style={s.quickRow}>
            {VALORES_RAPIDOS.map((v) => (
              <TouchableOpacity
                key={v}
                style={s.quickBtn}
                onPress={() => handleCreditar(v)}
                disabled={creditando}
                activeOpacity={0.7}
              >
                <Text style={s.quickTxt}>R$ {v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input manual */}
          <Text style={s.orTxt}>— ou insira um valor —</Text>
          <View style={s.inputRow}>
            <Text style={s.currencySymbol}>R$</Text>
            <TextInput
              style={s.valorInput}
              placeholder="0,00"
              placeholderTextColor={C.mLow}
              value={valorInput}
              onChangeText={setValorInput}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[s.creditarBtn, creditando && s.btnDisabled]}
              onPress={() => handleCreditar(parseFloat(valorInput.replace(',', '.')) || 0)}
              disabled={creditando}
              activeOpacity={0.8}
            >
              {creditando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.creditarTxt}>Adicionar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Histórico de transações */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>HISTÓRICO DE TRANSAÇÕES</Text>

          {transacoes.length === 0 && !loading && (
            <Text style={s.emptyTxt}>Nenhuma transação encontrada</Text>
          )}

          {transacoes.map((t) => (
            <View key={t.id} style={s.transacaoCard}>
              <View style={[s.txIcon, t.tipo === 'credito' ? s.txCredit : s.txDebit]}>
                <Text style={s.txIconTxt}>{t.tipo === 'credito' ? '↑' : '↓'}</Text>
              </View>
              <View style={s.txBody}>
                <Text style={s.txDesc} numberOfLines={1}>{t.descricao}</Text>
                <Text style={s.txData}>
                  {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={[s.txValor, t.tipo === 'credito' ? s.txCreditTxt : s.txDebitTxt]}>
                {t.tipo === 'credito' ? '+' : '-'} R$ {t.valor.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: C.bgDeep },
  content:  { padding: S.md, paddingTop: TOP_PADDING },
  back:     { marginBottom: 14 },
  backTxt:  { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading:  { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 20 },

  // Card de saldo
  saldoCard: {
    backgroundColor: C.bgCard2, borderRadius: R.lg,
    padding: 28, alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: C.bdrAccent,
    shadowColor: C.shadow, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
    overflow: 'hidden',
  },
  saldoGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: C.cyan, opacity: 0.8,
  },
  saldoLabel: { color: C.blue, fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  saldoValor: {
    color: C.cyan, fontSize: scale(38), fontWeight: '900',
    letterSpacing: 1, marginBottom: 14,
    textShadowColor: C.cyan + '44', textShadowRadius: 8,
  },
  saldoLine: { height: 1, width: 80, backgroundColor: C.bdrBase, marginBottom: 10 },
  saldoHint: { color: C.mLow, fontSize: 10 },

  // Seções
  section:      { marginBottom: 24 },
  sectionLabel: {
    color: C.blue, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 14,
  },

  // Botões rápidos
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickBtn: {
    backgroundColor: C.bgCard, borderRadius: R.sm,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.bdrAccent,
  },
  quickTxt: { color: C.blueL, fontWeight: '700', fontSize: 13 },

  orTxt: { color: C.mLow, fontSize: 11, marginBottom: 12, textAlign: 'center' },

  // Input row
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySymbol: { color: C.mMid, fontSize: 16, fontWeight: '600' },
  valorInput: {
    flex: 1, backgroundColor: C.bgInput,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.mHigh, fontSize: 16, minHeight: MIN_TOUCH_HEIGHT,
  },
  creditarBtn: {
    backgroundColor: C.green + 'CC', borderRadius: R.sm,
    borderWidth: 1, borderColor: C.greenBdr,
    paddingHorizontal: 16, minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  creditarTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Transações
  transacaoCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: R.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  txCredit: { backgroundColor: C.greenDark, borderWidth: 1, borderColor: C.greenBdr },
  txDebit:  { backgroundColor: C.redDark, borderWidth: 1, borderColor: C.redBdr },
  txIconTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  txBody: { flex: 1 },
  txDesc: { color: C.mHigh, fontSize: 13, fontWeight: '600' },
  txData: { color: C.mLow, fontSize: 11, marginTop: 2 },
  txValor: { fontSize: 14, fontWeight: '700' },
  txCreditTxt: { color: C.green },
  txDebitTxt:  { color: C.red },
  emptyTxt: { color: C.mLow, textAlign: 'center', marginTop: 20 },
});

export default CarteiraScreen;
