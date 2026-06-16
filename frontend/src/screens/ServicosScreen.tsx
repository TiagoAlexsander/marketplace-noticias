import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {
  listarServicos, criarServico, atualizarServico, removerServico, ServicoItem,
} from '../services/servicos';
import { listarPrestadores, PrestadorItem } from '../services/prestadores';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

// Configuração visual para cada status de serviço
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  aprovado:  { label: '● APROVADO',  color: C.green,  bg: C.greenDark,  border: C.greenBdr },
  pendente:  { label: '● PENDENTE',  color: C.yellow, bg: C.yellowDark, border: C.yellowBdr },
  rejeitado: { label: '● REJEITADO', color: C.red,    bg: C.redDark,    border: C.redBdr },
};

export const ServicosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [prestadores, setPrestadores] = useState<PrestadorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Encontra o prestador correspondente ao usuário logado
  const meuPrestador = useMemo(
    () => prestadores.find((p) => p.usuario_id === user?.id) || null,
    [prestadores, user?.id]
  );

  // Prestador vê apenas seus próprios serviços; admin vê todos
  const servicosVisiveis = useMemo(() => {
    if (user?.role === 'prestador') return servicos.filter((s) => s.usuario_id === user.id);
    return servicos;
  }, [servicos, user]);

  const carregar = async (preservarSelecao = false) => {
    setRefreshing(true);
    try {
      const [listaServicos, listaPrestadores] = await Promise.all([
        listarServicos(),
        listarPrestadores(),
      ]);
      setServicos(listaServicos);
      setPrestadores(listaPrestadores);

      if (!preservarSelecao) {
        const meu = listaPrestadores.find((p) => p.usuario_id === user?.id);
        if (meu) {
          setSelectedPrestadorId(String(meu.id));
        } else if (!selectedPrestadorId && listaPrestadores[0]) {
          setSelectedPrestadorId(String(listaPrestadores[0].id));
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os serviços');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, [user?.id]);

  const limpar = () => {
    if (meuPrestador) setSelectedPrestadorId(String(meuPrestador.id));
    else if (prestadores[0]) setSelectedPrestadorId(String(prestadores[0].id));
    else setSelectedPrestadorId('');
    setNome(''); setDescricao(''); setPreco(''); setEditingId(null);
  };

  const salvar = async () => {
    const precoNumeric = Number(preco);
    if (!nome.trim() || Number.isNaN(precoNumeric) || precoNumeric <= 0) {
      Alert.alert('Erro', 'Informe um nome e preço válidos');
      return;
    }
    const prestadorNumeric = Number(selectedPrestadorId);
    if (!prestadorNumeric) {
      Alert.alert('Erro', 'Selecione um prestador');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await atualizarServico(editingId, { prestador_id: prestadorNumeric, nome, descricao, preco: precoNumeric });
        Alert.alert('Serviço atualizado', user?.role === 'prestador'
          ? 'Sua edição foi enviada para aprovação.' : 'Serviço atualizado com sucesso.');
      } else {
        await criarServico({ prestador_id: prestadorNumeric, nome, descricao, preco: precoNumeric });
        Alert.alert('Serviço criado', user?.role === 'prestador'
          ? 'Aguardando aprovação do administrador.' : 'Serviço criado com sucesso.');
      }
      limpar();
      await carregar();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  const editar = (servico: ServicoItem) => {
    setEditingId(servico.id);
    setSelectedPrestadorId(String(servico.prestador_id));
    setNome(servico.nome);
    setDescricao(servico.descricao || '');
    setPreco(String(servico.preco));
  };

  const excluir = (id: number) => {
    Alert.alert('Confirmar exclusão', 'Deseja excluir este serviço permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await removerServico(id);
            await carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao excluir serviço');
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

        <Text style={s.heading}>{user?.role === 'prestador' ? 'Meus Serviços' : 'Gerenciar Serviços'}</Text>
        <Text style={s.subheading}>{user?.role === 'prestador' ? 'Crie e gerencie seus serviços' : `${servicosVisiveis.length} serviços cadastrados`}</Text>

        {/* Aviso para prestadores */}
        {user?.role === 'prestador' && (
          <View style={s.infoCard}>
            <View style={s.infoStrip} />
            <View style={s.infoBody}>
              <Text style={s.infoTitle}>FLUXO DE APROVAÇÃO</Text>
              <Text style={s.infoTxt}>Serviços criados aqui ficam aguardando aprovação do administrador antes de aparecerem para clientes.</Text>
            </View>
          </View>
        )}

        {/* Card do prestador logado */}
        {meuPrestador && user?.role === 'prestador' && (
          <View style={s.vinculoCard}>
            <Text style={s.vinculoLabel}>SEU PERFIL</Text>
            <Text style={s.vinculoNome}>{meuPrestador.usuario_nome || `Prestador #${meuPrestador.id}`}</Text>
          </View>
        )}

        {/* Formulário */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>{editingId ? '✏️  EDITANDO SERVIÇO' : '+ NOVO SERVIÇO'}</Text>

          {/* Seletor de prestador — somente admin */}
          {user?.role === 'admin' && (
            <>
              <Text style={s.fieldLabel}>PRESTADOR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {prestadores.map((p) => {
                  const sel = selectedPrestadorId === String(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.chip, sel && s.chipSel]}
                      onPress={() => setSelectedPrestadorId(String(p.id))}
                    >
                      <Text style={[s.chipTxt, sel && s.chipTxtSel]}>
                        {p.usuario_nome || `#${p.usuario_id}`}
                      </Text>
                      <Text style={[s.chipSub, sel && s.chipSubSel]}>#{p.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          <Text style={s.fieldLabel}>NOME DO SERVIÇO *</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Instalação de ar condicionado"
            placeholderTextColor={C.mLow}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={s.fieldLabel}>DESCRIÇÃO</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            placeholder="Descreva o que inclui o serviço..."
            placeholderTextColor={C.mLow}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={s.fieldLabel}>PREÇO (R$) *</Text>
          <TextInput
            style={s.input}
            placeholder="0,00"
            placeholderTextColor={C.mLow}
            value={preco}
            onChangeText={setPreco}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={salvar}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryTxt}>{editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR SERVIÇO →'}</Text>
            }
          </TouchableOpacity>

          {editingId ? (
            <TouchableOpacity style={s.btnCancel} onPress={limpar}>
              <Text style={s.btnCancelTxt}>CANCELAR EDIÇÃO</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Lista de serviços */}
        <Text style={s.sectionLabel}>
          {user?.role === 'prestador' ? 'MEUS SERVIÇOS' : `TODOS OS SERVIÇOS · ${servicosVisiveis.length}`}
        </Text>

        {refreshing && <ActivityIndicator color={C.blue} style={{ marginVertical: 12 }} />}

        {servicosVisiveis.length === 0 && !refreshing && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🔧</Text>
            <Text style={s.emptyTxt}>{user?.role === 'prestador' ? 'Você ainda não criou nenhum serviço.' : 'Nenhum serviço encontrado.'}</Text>
          </View>
        )}

        {servicosVisiveis.map((servico) => {
          const cfg = STATUS_CONFIG[servico.status] || STATUS_CONFIG.pendente;
          return (
            <View key={servico.id} style={s.card}>
              {/* Linha lateral colorida por status */}
              <View style={[s.cardLine, { backgroundColor: cfg.color }]} />

              <View style={s.cardBody}>
                <View style={s.cardHeader}>
                  <Text style={s.cardNome} numberOfLines={2}>{servico.nome}</Text>
                  <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {servico.descricao ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{servico.descricao}</Text>
                ) : null}

                <Text style={s.cardPrestador}>👤 {servico.prestador_nome || `Prestador #${servico.prestador_id}`}</Text>
                <Text style={s.cardPreco}>R$ {Number(servico.preco).toFixed(2)}</Text>

                {/* Motivo de rejeição */}
                {servico.status === 'rejeitado' && servico.motivo ? (
                  <View style={s.motivoBox}>
                    <Text style={s.motivoLabel}>MOTIVO DA REJEIÇÃO</Text>
                    <Text style={s.motivoTxt}>{servico.motivo}</Text>
                  </View>
                ) : null}

                <View style={s.cardActions}>
                  <TouchableOpacity style={s.btnEditar} onPress={() => editar(servico)} activeOpacity={0.8}>
                    <Text style={s.btnAcaoTxt}>✏ EDITAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnExcluir} onPress={() => excluir(servico.id)} activeOpacity={0.8}>
                    <Text style={s.btnAcaoTxt}>✕ EXCLUIR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
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

  infoCard: {
    flexDirection: 'row', backgroundColor: C.bgCard2,
    borderRadius: R.md, borderWidth: 1, borderColor: C.bdrAccent,
    marginBottom: 14, overflow: 'hidden',
  },
  infoStrip: { width: 3, backgroundColor: C.blueL },
  infoBody:  { flex: 1, padding: S.md },
  infoTitle: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  infoTxt:   { color: C.mMid, fontSize: 12, lineHeight: 18 },

  vinculoCard: {
    backgroundColor: C.bgCard, borderRadius: R.md, borderWidth: 1,
    borderColor: C.bdrBase, padding: S.md, marginBottom: 16,
  },
  vinculoLabel: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  vinculoNome:  { color: C.mHigh, fontWeight: '700', fontSize: 14 },

  formCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase, padding: S.md, marginBottom: 16,
  },
  formTitle: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  fieldLabel:{ color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },

  chip: {
    backgroundColor: C.bgBase, borderRadius: R.sm, borderWidth: 1,
    borderColor: C.bdrBase, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8,
  },
  chipSel:    { backgroundColor: C.bgCard2, borderColor: C.blueL },
  chipTxt:    { color: C.mMid, fontWeight: '700', fontSize: 12 },
  chipTxtSel: { color: C.mHigh },
  chipSub:    { color: C.mLow, fontSize: 10, marginTop: 2 },
  chipSubSel: { color: C.blueL },

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
  btnDisabled:    { opacity: 0.5 },
  btnPrimaryTxt:  { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  btnCancel:      { alignItems: 'center', paddingVertical: 12 },
  btnCancelTxt:   { color: C.mMid, fontSize: 12, letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: C.bdrBase, marginBottom: 16 },
  sectionLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },

  emptyBox:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTxt:  { color: C.mLow, fontSize: 13, textAlign: 'center' },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
  },
  cardLine: { width: 3 },
  cardBody: { flex: 1, padding: S.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardNome:   { color: C.mHigh, fontSize: 14, fontWeight: '700', flex: 1 },
  statusBadge:{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.full, borderWidth: 1 },
  statusTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardDesc:   { color: C.mMid, fontSize: 12, marginBottom: 6, lineHeight: 17 },
  cardPrestador: { color: C.mMid, fontSize: 12, marginBottom: 4 },
  cardPreco:  { color: C.cyan, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  motivoBox:  { backgroundColor: C.redDark, borderRadius: R.sm, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: C.redBdr },
  motivoLabel:{ color: C.red, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  motivoTxt:  { color: '#FFAAAA', fontSize: 12 },
  cardActions:{ flexDirection: 'row', gap: 8 },
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

export default ServicosScreen;
