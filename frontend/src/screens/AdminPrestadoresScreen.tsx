import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

type Solicitacao = {
  id: number;
  usuario_id: number;
  nome: string;
  email: string;
  descricao?: string | null;
  status: string;
  criado_em: string;
};

const AdminPrestadoresScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prestadores/solicitacoes');
      setSolicitacoes(res.data.dados || []);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    carregar();
  }, [user?.role]);

  const aprovar = async (id: number) => {
    try {
      await api.post(`/prestadores/solicitacoes/${id}/aprovar`);
      Alert.alert('Aprovado!', 'Solicitação aprovada com sucesso.');
      carregar();
    } catch {
      Alert.alert('Erro', 'Falha ao aprovar');
    }
  };

  const rejeitar = async (id: number) => {
    Alert.prompt(
      'Rejeitar solicitação',
      'Informe o motivo (opcional)',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          onPress: async (motivo?: string) => {
            try {
              await api.post(`/prestadores/solicitacoes/${id}/rejeitar`, { motivo: motivo || null });
              Alert.alert('Rejeitado', 'Solicitação rejeitada.');
              carregar();
            } catch {
              Alert.alert('Erro', 'Falha ao rejeitar');
            }
          },
        },
      ],
      'plain-text'
    );
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
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Gerenciar Prestadores</Text>
        <Text style={s.subheading}>Solicitações para virar prestador de serviços</Text>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 20 }} />}

        {!loading && solicitacoes.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>👤</Text>
            <Text style={s.emptyTitle}>Nenhuma solicitação</Text>
          </View>
        )}

        {solicitacoes.map((sol) => (
          <View key={sol.id} style={s.card}>
            {/* Linha de status */}
            <View style={[s.cardLine, {
              backgroundColor: sol.status === 'aprovado' ? C.green : sol.status === 'rejeitado' ? C.red : C.yellow
            }]} />

            <View style={s.cardBody}>
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardNome}>{sol.nome}</Text>
                  <Text style={s.cardEmail}>{sol.email}</Text>
                </View>
                <View style={[s.statusBadge, {
                  backgroundColor: (sol.status === 'aprovado' ? C.green : sol.status === 'rejeitado' ? C.red : C.yellow) + '22',
                  borderColor: (sol.status === 'aprovado' ? C.green : sol.status === 'rejeitado' ? C.red : C.yellow) + '55',
                }]}>
                  <Text style={[s.statusTxt, {
                    color: sol.status === 'aprovado' ? C.green : sol.status === 'rejeitado' ? C.red : C.yellow
                  }]}>
                    {sol.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {sol.descricao ? (
                <Text style={s.cardDesc}>{sol.descricao}</Text>
              ) : null}
              <Text style={s.cardData}>{new Date(sol.criado_em).toLocaleDateString('pt-BR')}</Text>

              {sol.status === 'pendente' && (
                <View style={s.actions}>
                  <TouchableOpacity style={s.btnAprovar} onPress={() => aprovar(sol.id)} activeOpacity={0.8}>
                    <Text style={s.btnTxt}>✓ APROVAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnRejeitar} onPress={() => rejeitar(sol.id)} activeOpacity={0.8}>
                    <Text style={s.btnTxt}>✕ REJEITAR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
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

  emptyBox:  { alignItems: 'center', marginTop: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle:{ color: C.mHigh, fontSize: 16, fontWeight: '700' },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
  },
  cardLine: { width: 3 },
  cardBody: { flex: 1, padding: S.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardNome:  { color: C.mHigh, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  cardEmail: { color: C.mMid, fontSize: 12 },
  cardDesc:  { color: C.mMid, fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardData:  { color: C.mLow, fontSize: 10, marginTop: 6 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.full, borderWidth: 1 },
  statusTxt:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnAprovar: {
    flex: 1, backgroundColor: C.greenDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.greenBdr,
    paddingVertical: 10, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnRejeitar: {
    flex: 1, backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 10, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
});

export default AdminPrestadoresScreen;
