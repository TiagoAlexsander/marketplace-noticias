import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { listarServicosPendentes, aprovarServico, rejeitarServico, ServicoItem } from '../services/servicos';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const AdminServicosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [servicos, setServicos] = useState<ServicoItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = async () => {
    setRefreshing(true);
    try {
      setServicos(await listarServicosPendentes());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os serviços pendentes');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleAprovar = async (servicoId: number) => {
    setProcessandoId(servicoId);
    try {
      await aprovarServico(servicoId);
      Alert.alert('Aprovado!', 'Serviço publicado com sucesso.');
      setExpandedId(null);
      carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível aprovar o serviço');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRejeitar = async (servicoId: number) => {
    if (!motivoRejeicao.trim()) {
      Alert.alert('Atenção', 'Informe o motivo da rejeição antes de continuar');
      return;
    }
    setProcessandoId(servicoId);
    try {
      await rejeitarServico(servicoId, motivoRejeicao);
      Alert.alert('Rejeitado', 'O prestador será notificado.');
      setMotivoRejeicao(''); setExpandedId(null);
      carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível rejeitar o serviço');
    } finally {
      setProcessandoId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[s.page, { justifyContent: 'center', alignItems: 'center', padding: S.lg }]}>
        <Text style={s.heading}>Acesso negado</Text>
        <Text style={s.subheading}>Somente administradores podem acessar esta área.</Text>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Aprovar Serviços</Text>
        <Text style={s.subheading}>Serviços aguardando análise</Text>

        {refreshing && <ActivityIndicator size="large" color={C.blue} style={{ marginVertical: 20 }} />}

        {!refreshing && servicos.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyTitle}>Nenhum serviço pendente</Text>
            <Text style={s.emptyDesc}>Todos os serviços foram analisados!</Text>
          </View>
        )}

        {servicos.map((servico) => (
          <TouchableOpacity
            key={servico.id}
            style={[s.card, expandedId === servico.id && s.cardExpanded]}
            onPress={() => { setExpandedId(expandedId === servico.id ? null : servico.id); setMotivoRejeicao(''); }}
            activeOpacity={0.85}
          >
            {/* Cabeçalho */}
            <View style={s.cardHeader}>
              <View style={s.cardInfo}>
                <Text style={s.cardNome}>{servico.nome}</Text>
                <Text style={s.cardPrestador}>👤 {servico.prestador_nome || `Prestador #${servico.prestador_id}`}</Text>
                <Text style={s.cardPreco}>R$ {Number(servico.preco).toFixed(2)}</Text>
              </View>
              <View style={s.pendenteBadge}>
                <Text style={s.pendenteTxt}>PENDENTE</Text>
              </View>
            </View>

            {/* Conteúdo expandido */}
            {expandedId === servico.id && (
              <View style={s.expanded}>
                {servico.descricao ? (
                  <>
                    <Text style={s.expandLabel}>DESCRIÇÃO</Text>
                    <Text style={s.expandTxt}>{servico.descricao}</Text>
                  </>
                ) : null}

                {servico.prestador_descricao ? (
                  <>
                    <Text style={s.expandLabel}>SOBRE O PRESTADOR</Text>
                    <Text style={s.expandTxt}>{servico.prestador_descricao}</Text>
                  </>
                ) : null}

                {/* Ações */}
                <View style={s.acoes}>
                  <TouchableOpacity
                    style={[s.btnAprovar, processandoId === servico.id && s.btnDisabled]}
                    onPress={() => handleAprovar(servico.id)}
                    disabled={processandoId === servico.id}
                    activeOpacity={0.8}
                  >
                    {processandoId === servico.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.btnTxt}>✓ APROVAR</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btnRejeitar, processandoId === servico.id && s.btnDisabled]}
                    onPress={() => handleRejeitar(servico.id)}
                    disabled={processandoId === servico.id}
                    activeOpacity={0.8}
                  >
                    {processandoId === servico.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.btnTxt}>✕ REJEITAR</Text>
                    }
                  </TouchableOpacity>
                </View>

                {/* Campo de motivo de rejeição */}
                <TextInput
                  style={s.motivoInput}
                  placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                  placeholderTextColor={C.mLow}
                  value={motivoRejeicao}
                  onChangeText={setMotivoRejeicao}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Indicador expandir */}
            <Text style={s.expandIndicator}>
              {expandedId === servico.id ? '▲ recolher' : '▼ ver detalhes'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  page:  { flex: 1, backgroundColor: C.bgDeep, paddingTop: TOP_PADDING },
  scroll:{ flex: 1, paddingHorizontal: S.md },
  back:  { marginBottom: 12, paddingVertical: 4 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading:  { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 20, lineHeight: 18 },

  emptyBox:  { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle:{ color: C.mHigh, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: C.mMid, fontSize: 14 },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    padding: S.md, marginBottom: 12,
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardExpanded: { borderColor: C.yellowBdr },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 10 },
  cardNome: { color: C.mHigh, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardPrestador: { color: C.mMid, fontSize: 12, marginBottom: 4 },
  cardPreco: { color: C.cyan, fontSize: 15, fontWeight: '800' },
  pendenteBadge: {
    backgroundColor: C.yellowDark, borderRadius: R.full,
    paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.yellowBdr,
  },
  pendenteTxt: { color: C.yellow, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  expanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.bdrBase },
  expandLabel: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  expandTxt:   { color: C.mMid, fontSize: 13, marginBottom: 14, lineHeight: 20 },

  acoes: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnAprovar: {
    flex: 1, backgroundColor: C.greenDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.greenBdr,
    paddingVertical: 12, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnRejeitar: {
    flex: 1, backgroundColor: C.redDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 12, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  motivoInput: {
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.redBdr,
    borderRadius: R.sm, padding: 12, color: C.mHigh, fontSize: 13,
    minHeight: 80, textAlignVertical: 'top',
  },
  expandIndicator: { color: C.blue, fontSize: 10, marginTop: 10, textAlign: 'right', letterSpacing: 0.5 },
});

export default AdminServicosScreen;
