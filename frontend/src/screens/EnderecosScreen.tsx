import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, Animated,
} from 'react-native';
import {
  listarEnderecos, criarEndereco, atualizarEndereco, removerEndereco, Endereco,
} from '../services/enderecos';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

const FORM_INICIAL = {
  label: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', cep: '',
};

// Campo de texto reutilizável com estilo do tema
interface CampoTextoProps {
  label: string;
  valor: string;
  campo: keyof typeof FORM_INICIAL;
  onChange: (c: keyof typeof FORM_INICIAL, v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
}
const CampoTexto: React.FC<CampoTextoProps> = ({
  label, valor, campo, onChange, placeholder, keyboardType, maxLength, autoCapitalize,
}) => (
  <View style={cf.wrap}>
    <Text style={cf.label}>{label}</Text>
    <TextInput
      style={cf.input}
      value={valor}
      onChangeText={(v) => onChange(campo, v)}
      placeholder={placeholder}
      placeholderTextColor={C.mLow}
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize || 'words'}
    />
  </View>
);

const cf = StyleSheet.create({
  wrap:  { marginBottom: 12 },
  label: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 12, paddingVertical: 10,
    color: C.mHigh, fontSize: 14, minHeight: MIN_TOUCH_HEIGHT,
  },
});

const EnderecosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await listarEnderecos();
      setEnderecos(lista);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os endereços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirForm = (endereco?: Endereco) => {
    if (endereco) {
      setEditandoId(endereco.id);
      setForm({
        label: endereco.label || '',
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento || '',
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
      });
    } else {
      setEditandoId(null);
      setForm(FORM_INICIAL);
    }
    setMostrarForm(true);
    formAnim.setValue(0);
    Animated.timing(formAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_INICIAL);
  };

  const handleSalvar = async () => {
    if (!form.logradouro || !form.numero || !form.bairro || !form.cidade || !form.estado || !form.cep) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios (*)');
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await atualizarEndereco(editandoId, form);
        Alert.alert('Endereço atualizado!');
      } else {
        await criarEndereco(form);
        Alert.alert('Endereço salvo!');
      }
      fecharForm();
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = (id: number, label: string) => {
    Alert.alert('Remover endereço?', `Deseja remover "${label || 'este endereço'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try { await removerEndereco(id); carregar(); }
          catch { Alert.alert('Erro', 'Não foi possível remover o endereço'); }
        },
      },
    ]);
  };

  const definirCampo = (campo: keyof typeof FORM_INICIAL, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        {/* Header com botão de novo */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.heading}>Meus Endereços</Text>
            <Text style={s.subheading}>Para contratação de serviços</Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, mostrarForm && s.addBtnCancel]}
            onPress={() => mostrarForm ? fecharForm() : abrirForm()}
            activeOpacity={0.8}
          >
            <Text style={[s.addBtnTxt, mostrarForm && s.addBtnCancelTxt]}>
              {mostrarForm ? '✕ Cancelar' : '+ Novo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        {mostrarForm && (
          <Animated.View style={[s.formCard, { opacity: formAnim }]}>
            <Text style={s.formTitle}>
              {editandoId ? '✏️ Editar endereço' : '➕ Novo endereço'}
            </Text>
            <CampoTexto label="APELIDO (EX: CASA, TRABALHO)" valor={form.label} campo="label" onChange={definirCampo} placeholder="Opcional" />
            <CampoTexto label="LOGRADOURO *" valor={form.logradouro} campo="logradouro" onChange={definirCampo} placeholder="Rua, Av, Travessa..." />
            <View style={s.row}>
              <View style={s.rowHalf}>
                <CampoTexto label="NÚMERO *" valor={form.numero} campo="numero" onChange={definirCampo} placeholder="123" keyboardType="numeric" />
              </View>
              <View style={s.rowHalf}>
                <CampoTexto label="COMPLEMENTO" valor={form.complemento} campo="complemento" onChange={definirCampo} placeholder="Apto, sala..." />
              </View>
            </View>
            <CampoTexto label="BAIRRO *" valor={form.bairro} campo="bairro" onChange={definirCampo} placeholder="Seu bairro" />
            <View style={s.row}>
              <View style={{ flex: 2 }}>
                <CampoTexto label="CIDADE *" valor={form.cidade} campo="cidade" onChange={definirCampo} placeholder="São Paulo" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <CampoTexto label="UF *" valor={form.estado} campo="estado" onChange={definirCampo} placeholder="SP" maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
            <CampoTexto label="CEP *" valor={form.cep} campo="cep" onChange={definirCampo} placeholder="00000-000" keyboardType="numeric" maxLength={9} />

            <TouchableOpacity
              style={[s.salvarBtn, salvando && s.btnDisabled]}
              onPress={handleSalvar}
              disabled={salvando}
              activeOpacity={0.8}
            >
              {salvando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.salvarTxt}>SALVAR ENDEREÇO</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Loading */}
        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 20 }} />}

        {/* Estado vazio */}
        {!loading && enderecos.length === 0 && !mostrarForm && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🗺️</Text>
            <Text style={s.emptyTitle}>Nenhum endereço cadastrado</Text>
            <Text style={s.emptyDesc}>Cadastre um endereço para facilitar a contratação de serviços</Text>
            <TouchableOpacity style={s.salvarBtn} onPress={() => abrirForm()} activeOpacity={0.8}>
              <Text style={s.salvarTxt}>+ ADICIONAR ENDEREÇO</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {enderecos.map((e) => (
            <View key={e.id} style={[s.card, e.is_padrao && s.cardPadrao]}>
              {/* Indicador de padrão */}
              {e.is_padrao && <View style={s.padraoAccent} />}

              <View style={s.cardTop}>
                <View style={s.cardInfo}>
                  {e.label && <Text style={s.cardLabel}>{e.label}</Text>}
                  {e.is_padrao && (
                    <View style={s.padraoPill}>
                      <Text style={s.padraoPillTxt}>⭐ Padrão</Text>
                    </View>
                  )}
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity style={s.editBtn} onPress={() => abrirForm(e)}>
                    <Text style={s.editTxt}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleRemover(e.id, e.label || `${e.logradouro}, ${e.numero}`)}
                  >
                    <Text style={s.deleteTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={s.cardEnd}>
                {e.logradouro}, {e.numero}
                {e.complemento ? ` · ${e.complemento}` : ''}
              </Text>
              <Text style={s.cardEnd}>{e.bairro} · {e.cidade}/{e.estado}</Text>
              <Text style={s.cardCep}>CEP {e.cep}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep },
  content: { padding: S.md, paddingTop: TOP_PADDING },
  back:    { marginBottom: 14 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heading:    { color: C.mHigh, fontSize: 22, fontWeight: '800' },
  subheading: { color: C.mMid, fontSize: 12, marginTop: 2 },

  addBtn: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 8, paddingHorizontal: 14,
    minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  addBtnCancel: { backgroundColor: C.bgCard, borderColor: C.bdrBase },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtnCancelTxt: { color: C.mMid },

  // Formulário
  formCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrAccent,
    padding: S.md, marginBottom: 20,
  },
  formTitle: { color: C.mHigh, fontWeight: '700', fontSize: 15, marginBottom: 16 },
  row:       { flexDirection: 'row', gap: 8 },
  rowHalf:   { flex: 1 },
  salvarBtn: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    padding: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.5 },
  salvarTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1.2 },

  // Estado vazio
  emptyBox:  { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle:{ color: C.mHigh, fontSize: 16, fontWeight: '700' },
  emptyDesc: { color: C.mLow, fontSize: 13, textAlign: 'center', maxWidth: 260 },

  // Cards de endereço
  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardPadrao: { borderColor: C.bdrAccent },
  padraoAccent: { height: 2, backgroundColor: C.blue, opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', padding: S.md, paddingBottom: 4 },
  cardInfo:  { flex: 1 },
  cardLabel: { color: C.mHigh, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  padraoPill: {
    backgroundColor: C.bgCard2, borderRadius: R.full,
    paddingVertical: 2, paddingHorizontal: 8, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: C.bdrAccent,
  },
  padraoPillTxt: { color: C.blueL, fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    backgroundColor: C.bgBase, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  editTxt: { fontSize: 14 },
  deleteBtn: {
    backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  deleteTxt: { fontSize: 14 },
  cardEnd: { color: C.mMid, fontSize: 13, marginBottom: 2, paddingHorizontal: S.md },
  cardCep: { color: C.mLow, fontSize: 11, paddingHorizontal: S.md, paddingBottom: S.md },
});

export default EnderecosScreen;
