import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import {
  listarPrestadores, criarPrestador, atualizarPrestador, removerPrestador, PrestadorItem,
} from '../services/prestadores';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const PrestadoresScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [prestadores, setPrestadores] = useState<PrestadorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const carregar = async () => {
    setRefreshing(true);
    try {
      setPrestadores(await listarPrestadores());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os prestadores');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const limpar = () => { setUsuarioId(''); setDescricao(''); setEditingId(null); };

  const salvar = async () => {
    const usuarioNumeric = Number(usuarioId);
    if (!usuarioNumeric) {
      Alert.alert('Atenção', 'Informe um ID de usuário válido');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await atualizarPrestador(editingId, { usuario_id: usuarioNumeric, descricao: descricao || null });
      } else {
        await criarPrestador({ usuario_id: usuarioNumeric, descricao: descricao || null });
      }
      limpar();
      await carregar();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar prestador');
    } finally {
      setLoading(false);
    }
  };

  const editar = (prestador: PrestadorItem) => {
    setEditingId(prestador.id);
    setUsuarioId(String(prestador.usuario_id));
    setDescricao(prestador.descricao || '');
  };

  const excluir = (id: number) => {
    Alert.alert('Confirmar exclusão', 'Deseja remover este prestador?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await removerPrestador(id);
            await carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao excluir prestador');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Prestadores</Text>
        <Text style={s.subheading}>{prestadores.length} prestadores cadastrados</Text>

        {/* Formulário */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>{editingId ? '✏️  EDITANDO PRESTADOR' : '+ NOVO PRESTADOR'}</Text>

          <Text style={s.fieldLabel}>ID DO USUÁRIO *</Text>
          <TextInput
            style={s.input}
            placeholder="Digite o ID numérico do usuário"
            placeholderTextColor={C.mLow}
            value={usuarioId}
            onChangeText={setUsuarioId}
            keyboardType="numeric"
          />

          <Text style={s.fieldLabel}>DESCRIÇÃO / BIO</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            placeholder="Descrição do prestador (opcional)"
            placeholderTextColor={C.mLow}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={salvar}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryTxt}>{editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRESTADOR →'}</Text>
            }
          </TouchableOpacity>

          {editingId ? (
            <TouchableOpacity style={s.btnCancel} onPress={limpar}>
              <Text style={s.btnCancelTxt}>CANCELAR EDIÇÃO</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Lista */}
        <View style={s.divider} />
        <Text style={s.sectionLabel}>TODOS OS PRESTADORES</Text>

        {refreshing && <ActivityIndicator color={C.blue} style={{ marginVertical: 12 }} />}

        {prestadores.length === 0 && !refreshing && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🔨</Text>
            <Text style={s.emptyTxt}>Nenhum prestador cadastrado</Text>
          </View>
        )}

        {prestadores.map((prestador) => (
          <View key={prestador.id} style={s.card}>
            {/* Linha lateral azul */}
            <View style={s.cardLine} />

            <View style={s.cardBody}>
              {/* Avatar inicial */}
              <View style={s.cardHeader}>
                <View style={s.avatarBox}>
                  <Text style={s.avatarTxt}>
                    {(prestador.usuario_nome || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardNome}>
                    {prestador.usuario_nome || `Usuário #${prestador.usuario_id}`}
                  </Text>
                  {prestador.usuario_email ? (
                    <Text style={s.cardEmail}>{prestador.usuario_email}</Text>
                  ) : null}
                  <Text style={s.cardId}>Prestador #{prestador.id} · Usuário #{prestador.usuario_id}</Text>
                </View>
              </View>

              {prestador.descricao ? (
                <>
                  <Text style={s.descLabel}>DESCRIÇÃO</Text>
                  <Text style={s.descTxt}>{prestador.descricao}</Text>
                </>
              ) : (
                <Text style={s.semDesc}>Sem descrição</Text>
              )}

              <View style={s.cardActions}>
                <TouchableOpacity style={s.btnEditar} onPress={() => editar(prestador)} activeOpacity={0.8}>
                  <Text style={s.btnAcaoTxt}>✏ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnExcluir} onPress={() => excluir(prestador.id)} activeOpacity={0.8}>
                  <Text style={s.btnAcaoTxt}>✕ EXCLUIR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep },
  content: { padding: S.md, paddingTop: TOP_PADDING, paddingBottom: 40 },
  back:    { marginBottom: 14 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading: { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 20 },

  formCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase, padding: S.md, marginBottom: 16,
  },
  formTitle: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  fieldLabel:{ color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.mHigh, fontSize: 14, marginBottom: 14, minHeight: MIN_TOUCH_HEIGHT,
  },
  inputMulti: { minHeight: 80, paddingTop: 12 },
  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled:   { opacity: 0.5 },
  btnPrimaryTxt: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  btnCancel:     { alignItems: 'center', paddingVertical: 12 },
  btnCancelTxt:  { color: C.mMid, fontSize: 12, letterSpacing: 0.5 },

  divider:      { height: 1, backgroundColor: C.bdrBase, marginBottom: 16 },
  sectionLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },

  emptyBox:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTxt:  { color: C.mLow, fontSize: 13, textAlign: 'center' },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
  },
  cardLine: { width: 3, backgroundColor: C.blueL },
  cardBody: { flex: 1, padding: S.md },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  avatarBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.blueDark, borderWidth: 1, borderColor: C.bdrAccent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: C.blueL, fontWeight: '800', fontSize: 16 },
  cardNome:  { color: C.mHigh, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardEmail: { color: C.mMid, fontSize: 12, marginBottom: 2 },
  cardId:    { color: C.mLow, fontSize: 10 },
  descLabel: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  descTxt:   { color: C.mMid, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  semDesc:   { color: C.mFade, fontSize: 11, fontStyle: 'italic', marginBottom: 10 },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnEditar: {
    flex: 1, backgroundColor: C.blueDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrAccent,
    paddingVertical: 9, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnExcluir: {
    flex: 1, backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 9, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnAcaoTxt: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.8 },
});

export default PrestadoresScreen;
