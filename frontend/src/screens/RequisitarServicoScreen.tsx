import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { listarServicos, ServicoItem } from '../services/servicos';
import { createPedido } from '../services/pedidos';
import { listarSlots, Slot } from '../services/slots';
import { listarEnderecos, Endereco } from '../services/enderecos';
import { adicionarFavorito, removerFavorito, listarFavoritos } from '../services/favoritos';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

const formatarSlot = (dataHora: string) =>
  new Date(dataHora).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

interface RequisitarServicoScreenProps {
  navigation: any;
  route?: { params?: { servicoId?: number } };
}

export const RequisitarServicoScreen: React.FC<RequisitarServicoScreenProps> = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const servicoIdParam = route?.params?.servicoId;

  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [selectedServicoId, setSelectedServicoId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<number | null>(null);
  const [tipoLocal, setTipoLocal] = useState<'endereco_usuario' | 'local_prestador'>('endereco_usuario');
  const [favoritados, setFavoritados] = useState<Set<number>>(new Set());
  const [togglendoFav, setTogglendoFav] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const carregar = async () => {
    setRefreshing(true);
    try {
      const [lista, endLista, favLista] = await Promise.all([
        listarServicos(), listarEnderecos(), listarFavoritos(),
      ]);
      setServicos(lista);
      setEnderecos(endLista);
      setFavoritados(new Set(favLista.map((f) => f.id)));
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      if (servicoIdParam) {
        const alvo = lista.find((s) => s.id === servicoIdParam);
        if (alvo) handleSelecionarServico(alvo);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os serviços');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleSelecionarServico = async (servico: ServicoItem) => {
    if (selectedServicoId === servico.id) {
      setSelectedServicoId(null); setSlots([]); setSelectedSlotId(null);
      return;
    }
    setSelectedServicoId(servico.id);
    setSelectedSlotId(null); setSlots([]);

    if (servico.prestador_id) {
      setLoadingSlots(true);
      try {
        setSlots(await listarSlots(servico.prestador_id));
      } catch { /* Sem slots não é crítico */ }
      finally { setLoadingSlots(false); }
    }
  };

  const handleToggleFavorito = async (servicoId: number) => {
    setTogglendoFav(servicoId);
    try {
      if (favoritados.has(servicoId)) {
        await removerFavorito(servicoId);
        setFavoritados((prev) => { const n = new Set(prev); n.delete(servicoId); return n; });
      } else {
        await adicionarFavorito(servicoId);
        setFavoritados((prev) => new Set(prev).add(servicoId));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar favoritos');
    } finally {
      setTogglendoFav(null);
    }
  };

  const handleRequisitar = async (servicoId: number) => {
    if (tipoLocal === 'endereco_usuario' && enderecos.length > 0 && !selectedEnderecoId) {
      Alert.alert('Atenção', 'Selecione um endereço ou escolha "No local do prestador"');
      return;
    }
    setLoading(true);
    try {
      await createPedido(servicoId, mensagem, selectedSlotId || undefined, selectedEnderecoId || undefined, tipoLocal);
      Alert.alert('Pedido enviado!', 'Sua solicitação foi enviada ao prestador.');
      setMensagem(''); setSelectedServicoId(null); setSelectedSlotId(null); setSelectedEnderecoId(null);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível enviar o pedido');
    } finally {
      setLoading(false);
    }
  };

  const servicosFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return servicos;
    return servicos.filter((s) =>
      s.nome.toLowerCase().includes(t) ||
      (s.prestador_nome || '').toLowerCase().includes(t) ||
      (s.descricao || '').toLowerCase().includes(t)
    );
  }, [servicos, busca]);

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Buscar Serviços</Text>
        <Text style={s.subheading}>Selecione, agende e envie sua solicitação</Text>

        {/* Barra de busca */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nome, prestador ou descrição..."
            placeholderTextColor={C.mLow}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={s.clearBtn}>
              <Text style={s.clearTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {busca.trim().length > 0 && (
          <Text style={s.resultCount}>
            {servicosFiltrados.length === 0 ? 'Nenhum resultado' : `${servicosFiltrados.length} resultado(s)`}
          </Text>
        )}

        {refreshing && <ActivityIndicator size="large" color={C.blue} style={{ marginVertical: 20 }} />}

        {!refreshing && servicosFiltrados.length === 0 && !busca.trim() && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🛠️</Text>
            <Text style={s.emptyTxt}>Nenhum serviço disponível no momento</Text>
          </View>
        )}

        {/* Lista de serviços */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {servicosFiltrados.map((servico) => {
            const isSel = selectedServicoId === servico.id;
            const isFav = favoritados.has(servico.id);
            const toggling = togglendoFav === servico.id;

            return (
              <View key={servico.id} style={[s.card, isSel && s.cardSel]}>
                {isSel && <View style={s.cardSelLine} />}

                {/* Área clicável para selecionar */}
                <TouchableOpacity style={s.cardTouch} onPress={() => handleSelecionarServico(servico)} activeOpacity={0.8}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardNome} numberOfLines={2}>{servico.nome}</Text>
                    {/* Favorito */}
                    <TouchableOpacity style={s.favBtn} onPress={() => handleToggleFavorito(servico.id)} disabled={toggling}>
                      {toggling
                        ? <ActivityIndicator size="small" color={C.red} />
                        : <Text style={[s.favIcon, isFav && s.favIconAtivo]}>{isFav ? '❤️' : '🤍'}</Text>
                      }
                    </TouchableOpacity>
                  </View>

                  <Text style={s.cardPrestador}>👤 {servico.prestador_nome || 'Prestador'}</Text>

                  {servico.descricao ? (
                    <Text style={s.cardDesc} numberOfLines={isSel ? undefined : 2}>
                      {servico.descricao}
                    </Text>
                  ) : null}

                  <View style={s.cardFooter}>
                    <Text style={s.cardPreco}>R$ {Number(servico.preco).toFixed(2)}</Text>
                    {isSel && (
                      <View style={s.selBadge}>
                        <Text style={s.selBadgeTxt}>✓ SELECIONADO</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Formulário expandido */}
                {isSel && (
                  <View style={s.form}>
                    <View style={s.formDivider} />

                    {/* Horário */}
                    <Text style={s.formLabel}>HORÁRIO (OPCIONAL)</Text>
                    {loadingSlots && <ActivityIndicator color={C.blue} size="small" />}
                    {!loadingSlots && slots.length === 0 && (
                      <Text style={s.semSlotsTxt}>Prestador sem horários cadastrados — pode enviar assim mesmo</Text>
                    )}
                    {!loadingSlots && slots.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.slotsScroll}>
                        {slots.map((sl) => (
                          <TouchableOpacity
                            key={sl.id}
                            style={[s.slotChip, selectedSlotId === sl.id && s.slotChipSel]}
                            onPress={() => setSelectedSlotId(selectedSlotId === sl.id ? null : sl.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.slotTxt, selectedSlotId === sl.id && s.slotTxtSel]}>
                              {formatarSlot(sl.data_hora)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Local */}
                    <Text style={[s.formLabel, { marginTop: 14 }]}>LOCAL DE ATENDIMENTO</Text>
                    <View style={s.tipoLocalRow}>
                      <TouchableOpacity
                        style={[s.tipoBtn, tipoLocal === 'endereco_usuario' && s.tipoBtnSel]}
                        onPress={() => setTipoLocal('endereco_usuario')}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.tipoBtnTxt, tipoLocal === 'endereco_usuario' && s.tipoBtnTxtSel]}>🏠 Meu endereço</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.tipoBtn, tipoLocal === 'local_prestador' && s.tipoBtnSel]}
                        onPress={() => setTipoLocal('local_prestador')}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.tipoBtnTxt, tipoLocal === 'local_prestador' && s.tipoBtnTxtSel]}>🔧 Local do prestador</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Lista de endereços */}
                    {tipoLocal === 'endereco_usuario' && (
                      <>
                        {enderecos.length === 0 ? (
                          <TouchableOpacity style={s.addEndBtn} onPress={() => navigation.navigate('Enderecos')}>
                            <Text style={s.addEndTxt}>+ Cadastrar endereço</Text>
                          </TouchableOpacity>
                        ) : (
                          enderecos.map((e) => (
                            <TouchableOpacity
                              key={e.id}
                              style={[s.endChip, selectedEnderecoId === e.id && s.endChipSel]}
                              onPress={() => setSelectedEnderecoId(selectedEnderecoId === e.id ? null : e.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={s.endLabel}>{e.label || 'Endereço'}</Text>
                              <Text style={s.endEnd} numberOfLines={1}>
                                {e.logradouro}, {e.numero} — {e.cidade}/{e.estado}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </>
                    )}

                    {/* Mensagem */}
                    <Text style={[s.formLabel, { marginTop: 14 }]}>MENSAGEM (OPCIONAL)</Text>
                    <TextInput
                      style={s.msgInput}
                      placeholder="Descreva o que precisa, observações..."
                      placeholderTextColor={C.mLow}
                      value={mensagem}
                      onChangeText={setMensagem}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />

                    {/* Botão enviar */}
                    <TouchableOpacity
                      style={[s.enviarBtn, loading && s.btnDisabled]}
                      onPress={() => handleRequisitar(servico.id)}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={s.enviarTxt}>ENVIAR SOLICITAÇÃO →</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgDeep, paddingTop: TOP_PADDING },
  scroll:    { flex: 1, paddingHorizontal: S.md },
  back:      { marginBottom: 12, paddingVertical: 4 },
  backTxt:   { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading:   { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading:{ color: C.mMid, fontSize: 13, lineHeight: 18, marginBottom: 16 },

  // Barra de busca
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 12, marginBottom: 10, minHeight: MIN_TOUCH_HEIGHT,
  },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: C.mHigh, fontSize: 14, paddingVertical: 10 },
  clearBtn:    { padding: 6 },
  clearTxt:    { color: C.mMid, fontSize: 14 },
  resultCount: { color: C.mLow, fontSize: 11, marginBottom: 10 },

  emptyBox: { alignItems: 'center', marginTop: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTxt:  { color: C.mLow, fontSize: 14, textAlign: 'center' },

  // Cards de serviço
  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 10, overflow: 'hidden',
  },
  cardSel: {
    borderColor: C.bdrAccent,
    shadowColor: C.blue, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  cardSelLine: { height: 2, backgroundColor: C.blue, opacity: 0.8 },
  cardTouch:   { padding: S.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardNome:   { color: C.mHigh, fontSize: 15, fontWeight: '700', flex: 1 },
  favBtn:     { padding: 4 },
  favIcon:    { fontSize: 20, opacity: 0.4 },
  favIconAtivo: { opacity: 1 },
  cardPrestador: { color: C.mMid, fontSize: 12, marginBottom: 4 },
  cardDesc:   { color: C.mLow, fontSize: 12, marginBottom: 6, lineHeight: 17 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPreco:  { color: C.cyan, fontSize: 16, fontWeight: '800' },
  selBadge: { backgroundColor: C.blue + '22', borderRadius: R.full, borderWidth: 1, borderColor: C.bdrAccent, paddingVertical: 3, paddingHorizontal: 8 },
  selBadgeTxt:{ color: C.blueL, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Formulário expandido
  form:       { paddingHorizontal: S.md, paddingBottom: S.md },
  formDivider:{ height: 1, backgroundColor: C.bdrBase, marginBottom: S.md },
  formLabel:  { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  semSlotsTxt:{ color: C.mLow, fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  slotsScroll:{ marginBottom: 4 },
  slotChip: {
    backgroundColor: C.bgBase, borderRadius: R.sm,
    paddingVertical: 8, paddingHorizontal: 12,
    marginRight: 8, borderWidth: 1, borderColor: C.bdrBase,
  },
  slotChipSel: { borderColor: C.green, backgroundColor: C.greenDark },
  slotTxt:    { color: C.mMid, fontSize: 12 },
  slotTxtSel: { color: C.green, fontWeight: '700' },

  tipoLocalRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipoBtn: {
    flex: 1, backgroundColor: C.bgBase, borderRadius: R.sm,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: C.bdrBase,
  },
  tipoBtnSel: { borderColor: C.bdrAccent, backgroundColor: C.bgCard2 },
  tipoBtnTxt:    { color: C.mMid, fontSize: 12, fontWeight: '600' },
  tipoBtnTxtSel: { color: C.blueL },

  endChip: {
    backgroundColor: C.bgBase, borderRadius: R.sm, padding: 10,
    marginBottom: 6, borderWidth: 1, borderColor: C.bdrBase,
  },
  endChipSel: { borderColor: C.bdrAccent, backgroundColor: C.bgCard },
  endLabel: { color: C.mHigh, fontSize: 13, fontWeight: '700' },
  endEnd:   { color: C.mMid, fontSize: 11, marginTop: 2 },
  addEndBtn: {
    backgroundColor: C.bgBase, borderRadius: R.sm, padding: 12,
    alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: C.bdrAccent, borderStyle: 'dashed',
  },
  addEndTxt: { color: C.blueL, fontSize: 13, fontWeight: '600' },

  msgInput: {
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.bdrBase,
    borderRadius: R.sm, padding: 12, color: C.mHigh, marginBottom: 12,
    minHeight: 70, fontSize: 13,
  },
  enviarBtn: {
    backgroundColor: C.blue, borderRadius: R.sm, borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  enviarTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
});

export default RequisitarServicoScreen;
