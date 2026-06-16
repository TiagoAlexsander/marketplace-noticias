import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {
  listarSolicitacoes, aprovarSolicitacao, rejeitarSolicitacao, SolicitacaoPrestador,
} from '../services/prestadorSolicitacoes';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const AdminSolicitacoesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPrestador[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const carregar = async () => {
    setRefreshing(true);
    try {
      setSolicitacoes(await listarSolicitacoes());
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as solicitações');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleAprovar = async (id: number) => {
    setProcessandoId(id);
    try {
      await aprovarSolicitacao(id);
      Alert.alert('Aprovado!', 'O usuário agora é um prestador.');
      carregar(); setExpandedId(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível aprovar');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRejeitar = async (id: number) => {
    if (!motivoRejeicao.trim()) {
      Alert.alert('Atenção', 'Digite um motivo para a rejeição');
      return;
    }
    setProcessandoId(id);
    try {
      await rejeitarSolicitacao(id, motivoRejeicao);
      Alert.alert('Rejeitado', 'Solicitação rejeitada.');
      carregar(); setMotivoRejeicao(''); setExpandedId(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível rejeitar');
    } finally {
      setProcessandoId(null);
    }
  };

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente');
  const historico = solicitacoes.filter((s) => s.status !== 'pendente');

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Solicitações de Prestador</Text>
        <Text style={s.subheading}>Aprove ou rejeite usuários que desejam ser prestadores</Text>

        {refreshing && <ActivityIndicator size="large" color={C.blue} style={{ marginVertical: 20 }} />}

        {solicitacoes.length === 0 && !refreshing && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>Nenhuma solicitação</Text>
            <Text style={s.emptyDesc}>Quando usuários solicitarem, aparecerão aqui.</Text>
          </View>
        )}

        {/* Pendentes */}
        {pendentes.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>PENDENTES ({pendentes.length})</Text>

            {pendentes.map((sol) => (
              <TouchableOpacity
                key={sol.id}
                style={[s.card, expandedId === sol.id && s.cardExpanded]}
                onPress={() => { setExpandedId(expandedId === sol.id ? null : sol.id); setMotivoRejeicao(''); }}
                activeOpacity={0.85}
              >
                <View style={s.cardHeader}>
                  <View style={s.cardInfo}>
                    <Text style={s.cardNome}>{sol.nome}</Text>
                    <Text style={s.cardEmail}>{sol.email}</Text>
                    <Text style={s.cardData}>
                      {new Date(sol.criado_em).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={s.pendenteBadge}>
                    <Text style={s.pendenteTxt}>PENDENTE</Text>
                  </View>
                </View>

                {expandedId === sol.id && (
                  <View style={s.expanded}>
                    <Text style={s.expandLabel}>DESCRIÇÃO / MOTIVAÇÃO</Text>
                    <Text style={s.expandTxt}>{sol.descricao || 'Sem descrição informada.'}</Text>

                    <View style={s.acoes}>
                      <TouchableOpacity
                        style={[s.btnAprovar, processandoId === sol.id && s.btnDisabled]}
                        onPress={() => handleAprovar(sol.id)}
                        disabled={processandoId === sol.id}
                        activeOpacity={0.8}
                      >
                        {processandoId === sol.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={s.btnTxt}>✓ APROVAR</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.btnRejeitar, processandoId === sol.id && s.btnDisabled]}
                        onPress={() => handleRejeitar(sol.id)}
                        disabled={processandoId === sol.id}
                        activeOpacity={0.8}
                      >
                        {processandoId === sol.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={s.btnTxt}>✕ REJEITAR</Text>
                        }
                      </TouchableOpacity>
                    </View>

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

                <Text style={s.expandIndicator}>
                  {expandedId === sol.id ? '▲ recolher' : '▼ ver detalhes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionLabel}>HISTÓRICO ({historico.length})</Text>

            {historico.map((sol) => {
              const aprovado = sol.status === 'aprovado';
              return (
                <View key={sol.id} style={[s.card, aprovado ? s.cardAprovado : s.cardRejeitado]}>
                  <View style={s.cardHeader}>
                    <View style={s.cardInfo}>
                      <Text style={s.cardNome}>{sol.nome}</Text>
                      <Text style={s.cardEmail}>{sol.email}</Text>
                      <Text style={s.cardData}>{new Date(sol.criado_em).toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <View style={[s.histBadge, aprovado ? s.histBadgeAprv : s.histBadgeRej]}>
                      <Text style={[s.histBadgeTxt, aprovado ? s.histTxtAprv : s.histTxtRej]}>
                        {aprovado ? 'APROVADO' : 'REJEITADO'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep, paddingTop: TOP_PADDING },
  scroll:  { flex: 1, paddingHorizontal: S.md },
  back:    { marginBottom: 12, paddingVertical: 4 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading: { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 20 },

  emptyBox:  { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle:{ color: C.mHigh, fontSize: 16, fontWeight: '700' },
  emptyDesc: { color: C.mMid, fontSize: 13, textAlign: 'center' },

  sectionLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    padding: S.md, marginBottom: 12,
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardExpanded: { borderColor: C.yellowBdr },
  cardAprovado: { borderColor: C.greenBdr },
  cardRejeitado:{ borderColor: C.redBdr },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardNome:  { color: C.mHigh, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardEmail: { color: C.mMid, fontSize: 12, marginBottom: 3 },
  cardData:  { color: C.mLow, fontSize: 11 },

  pendenteBadge: {
    backgroundColor: C.yellowDark, borderRadius: R.full,
    paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.yellowBdr,
  },
  pendenteTxt: { color: C.yellow, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  histBadge:    { borderRadius: R.full, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1 },
  histBadgeAprv:{ backgroundColor: C.greenDark, borderColor: C.greenBdr },
  histBadgeRej: { backgroundColor: C.redDark, borderColor: C.redBdr },
  histBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  histTxtAprv:  { color: C.green },
  histTxtRej:   { color: C.red },

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

export default AdminSolicitacoesScreen;
