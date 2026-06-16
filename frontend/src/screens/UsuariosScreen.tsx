import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import {
  listarUsuarios, criarUsuario, atualizarUsuario, removerUsuario, UsuarioItem,
} from '../services/usuarios';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const UsuariosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const carregar = async () => {
    setRefreshing(true);
    try {
      setUsuarios(await listarUsuarios());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const limpar = () => { setNome(''); setEmail(''); setEditingId(null); };

  const salvar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Informe nome e email');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await atualizarUsuario(editingId, { nome, email });
      } else {
        await criarUsuario({ nome, email });
      }
      limpar();
      await carregar();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const editar = (usuario: UsuarioItem) => {
    setEditingId(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
  };

  const excluir = (id: number) => {
    Alert.alert('Confirmar exclusão', 'Deseja remover este usuário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await removerUsuario(id);
            await carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao excluir usuário');
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

        <Text style={s.heading}>Usuários</Text>
        <Text style={s.subheading}>{usuarios.length} usuários cadastrados</Text>

        {/* Formulário */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>{editingId ? '✏️  EDITANDO USUÁRIO' : '+ NOVO USUÁRIO'}</Text>

          <Text style={s.fieldLabel}>NOME *</Text>
          <TextInput
            style={s.input}
            placeholder="Nome completo"
            placeholderTextColor={C.mLow}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={s.fieldLabel}>E-MAIL *</Text>
          <TextInput
            style={s.input}
            placeholder="usuario@email.com"
            placeholderTextColor={C.mLow}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={salvar}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryTxt}>{editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO →'}</Text>
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
        <Text style={s.sectionLabel}>TODOS OS USUÁRIOS</Text>

        {refreshing && <ActivityIndicator color={C.blue} style={{ marginVertical: 12 }} />}

        {usuarios.length === 0 && !refreshing && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTxt}>Nenhum usuário cadastrado</Text>
          </View>
        )}

        {usuarios.map((usuario) => (
          <View key={usuario.id} style={s.card}>
            <View style={s.cardLine} />
            <View style={s.cardBody}>
              <Text style={s.cardNome}>{usuario.nome}</Text>
              <Text style={s.cardEmail}>{usuario.email}</Text>
              <Text style={s.cardId}>ID: {usuario.id}</Text>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.btnEditar} onPress={() => editar(usuario)} activeOpacity={0.8}>
                  <Text style={s.btnAcaoTxt}>✏ EDITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnExcluir} onPress={() => excluir(usuario.id)} activeOpacity={0.8}>
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
    marginBottom: 10, flexDirection: 'row', overflow: 'hidden',
  },
  cardLine: { width: 3, backgroundColor: C.blue },
  cardBody: { flex: 1, padding: S.md },
  cardNome:  { color: C.mHigh, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardEmail: { color: C.mMid, fontSize: 13, marginBottom: 2 },
  cardId:    { color: C.mLow, fontSize: 11, marginBottom: 10 },
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

export default UsuariosScreen;
