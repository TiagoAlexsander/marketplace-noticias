import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import pedidosService from '../services/pedidos';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Aguardando sua resposta',
  aceito: 'Aceito · cliente pagando',
  recusado: 'Recusado',
  em_andamento: 'Em andamento',
  aguardando_confirmacao: 'Aguardando confirmação',
  expirado: 'Concluído',
};

const STATUS_COR: Record<string, string> = {
  pendente: C.yellow,
  aceito: C.green,
  recusado: C.red,
  em_andamento: C.blue,
  aguardando_confirmacao: C.purple,
  expirado: C.mLow,
};

const formatarSlot = (dataHora: string) =>
  new Date(dataHora).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const PrestadorPedidosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const todos = await pedidosService.getPedidosForPrestador();
      const meus = (todos || []).filter((p: any) => Number(p.prestador_usuario_id) === Number(user?.id));
      setPedidos(meus);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'prestador') return;
    carregar();
  }, [user?.id, user?.role]);

  const aceitar = async (id: number) => {
    Alert.alert('Aceitar pedido?', 'Confirma que deseja aceitar este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceitar',
        onPress: async () => {
          try {
            await pedidosService.acceptPedido(id);
            Alert.alert('Aceito!', 'O cliente será notificado para realizar o pagamento.');
            carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao aceitar pedido');
          }
        },
      },
    ]);
  };

  const recusar = async (id: number) => {
    Alert.alert('Recusar pedido?', 'Tem certeza que deseja recusar esta solicitação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recusar', style: 'destructive',
        onPress: async () => {
          try {
            await pedidosService.declinePedido(id);
            carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao recusar pedido');
          }
        },
      },
    ]);
  };

  const confirmarConclusao = async (id: number) => {
    Alert.alert('Confirmar Conclusão?', 'Você confirma que o serviço foi concluído?', [
      { text: 'Ainda não', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await pedidosService.confirmByPrestador(id);
            Alert.alert('Confirmação registrada!', 'Quando o cliente também confirmar, o pedido será finalizado.');
            carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao confirmar');
          }
        },
      },
    ]);
  };

  // Bloqueio de acesso
  if (user?.role !== 'prestador') {
    return (
      <View style={[s.page, { justifyContent: 'center', alignItems: 'center', padding: S.lg }]}>
        <Text style={s.heading}>Acesso negado</Text>
        <Text style={s.subheading}>Somente prestadores podem acessar esta área.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Pedidos Recebidos</Text>
        <Text style={s.subheading}>Gerencie as solicitações dos clientes</Text>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 20 }} />}

        {/* Estado vazio */}
        {!loading && pedidos.length === 0 && (
          <View style={s.emptyBox}>
            <View style={s.emptyIcon}><Text style={s.emptyIconTxt}>📭</Text></View>
            <Text style={s.emptyTitle}>Nenhum pedido recebido</Text>
            <Text style={s.emptyDesc}>
              Quando clientes solicitarem seus serviços, aparecerão aqui.
            </Text>
          </View>
        )}

        {/* Lista de pedidos */}
        {pedidos.map((p) => {
          const statusLabel = STATUS_LABEL[p.status] || p.status;
          const statusCor = STATUS_COR[p.status] || C.mLow;
          const jaConfirmou = p.confirmado_prestador === 1;

          return (
            <View key={p.id} style={s.card}>
              <View style={[s.cardSidebar, { backgroundColor: statusCor }]} />

              <View style={s.cardBody}>
                {/* Cabeçalho */}
                <View style={s.cardHeader}>
                  <Text style={s.cardId}>PEDIDO #{p.id}</Text>
                  <View style={[s.statusBadge, { backgroundColor: statusCor + '22', borderColor: statusCor + '55' }]}>
                    <Text style={[s.statusTxt, { color: statusCor }]}>{statusLabel.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={s.cardServico}>{p.servico_nome || `Serviço #${p.servico_id}`}</Text>
                <Text style={s.cardCliente}>👤 Cliente: {p.contratante_nome || 'Cliente'}</Text>
                <Text style={s.cardValor}>R$ {Number(p.valor).toFixed(2)}</Text>

                {/* Horário agendado */}
                {p.slot_data_hora ? (
                  <Text style={s.cardSlot}>
                    📅 {formatarSlot(p.slot_data_hora)}{p.slot_duracao ? ` (${p.slot_duracao} min)` : ''}
                  </Text>
                ) : null}

                {/* Local */}
                {p.tipo_local === 'local_prestador' ? (
                  <Text style={s.cardLocal}>📍 Atendimento no seu local</Text>
                ) : p.end_logradouro ? (
                  <Text style={s.cardLocal}>
                    📍 {p.end_label ? `${p.end_label}: ` : ''}{p.end_logradouro}, {p.end_numero} — {p.end_cidade}/{p.end_estado}
                  </Text>
                ) : null}

                {/* Mensagem do cliente */}
                {p.mensagem ? (
                  <View style={s.msgBox}>
                    <Text style={s.msgLabel}>MENSAGEM DO CLIENTE</Text>
                    <Text style={s.msgTxt}>"{p.mensagem}"</Text>
                  </View>
                ) : null}

                {/* Ações */}
                <View style={s.actions}>
                  {/* Pendente: aceitar ou recusar */}
                  {p.status === 'pendente' && (
                    <>
                      <TouchableOpacity style={s.btnAceitar} onPress={() => aceitar(p.id)} activeOpacity={0.8}>
                        <Text style={s.btnAcaoTxt}>✓ ACEITAR</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.btnRecusar} onPress={() => recusar(p.id)} activeOpacity={0.8}>
                        <Text style={s.btnAcaoTxt}>✕ RECUSAR</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Em andamento: confirmar conclusão */}
                  {(p.status === 'em_andamento' || p.status === 'aguardando_confirmacao') && !jaConfirmou && (
                    <TouchableOpacity style={s.btnConcluir} onPress={() => confirmarConclusao(p.id)} activeOpacity={0.8}>
                      <Text style={s.btnAcaoTxt}>🏁 CONFIRMAR CONCLUSÃO</Text>
                    </TouchableOpacity>
                  )}

                  {/* Já confirmou */}
                  {p.status === 'aguardando_confirmacao' && jaConfirmou && (
                    <View style={s.aguardandoBox}>
                      <Text style={s.aguardandoTxt}>✓ Você confirmou — aguardando cliente</Text>
                    </View>
                  )}
                </View>

                <Text style={s.cardData}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</Text>
              </View>
            </View>
          );
        })}
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

  emptyBox:    { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bdrBase, alignItems: 'center', justifyContent: 'center' },
  emptyIconTxt:{ fontSize: 30 },
  emptyTitle:  { color: C.mHigh, fontSize: 16, fontWeight: '700' },
  emptyDesc:   { color: C.mLow, fontSize: 13, textAlign: 'center', maxWidth: 260 },

  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardSidebar: { width: 3 },
  cardBody: { flex: 1, padding: S.md },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8, gap: 8,
  },
  cardId:     { color: C.mLow, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  statusBadge:{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.full, borderWidth: 1, flexShrink: 1 },
  statusTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  cardServico: { color: C.mHigh, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardCliente: { color: C.mMid, fontSize: 12, marginBottom: 4 },
  cardValor:   { color: C.cyan, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  cardSlot:    { color: C.green, fontSize: 12, marginBottom: 3 },
  cardLocal:   { color: C.mMid, fontSize: 11, marginBottom: 3 },

  msgBox: {
    backgroundColor: C.bgBase, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    padding: 10, marginTop: 8,
  },
  msgLabel: { color: C.blue, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 4 },
  msgTxt:   { color: C.mMid, fontSize: 13, fontStyle: 'italic' },

  cardData: { color: C.mFade, fontSize: 10, marginTop: 8 },

  actions:   { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btnAceitar: {
    flex: 1, minWidth: 110, backgroundColor: C.greenDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.greenBdr,
    paddingVertical: 11, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnRecusar: {
    flex: 1, minWidth: 110, backgroundColor: C.redDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 11, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnConcluir: {
    flex: 1, backgroundColor: C.purpleDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.purpleBdr,
    paddingVertical: 11, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnAcaoTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  aguardandoBox: {
    flex: 1, backgroundColor: C.purpleDark,
    borderRadius: R.sm, borderWidth: 1, borderColor: C.purpleBdr, padding: 10,
  },
  aguardandoTxt: { color: C.purple, fontSize: 12, fontWeight: '600' },
});

export default PrestadorPedidosScreen;
