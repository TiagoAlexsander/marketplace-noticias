import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import pedidosService from '../services/pedidos';
import { getCarteira } from '../services/carteira';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

// Rótulos de status
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Aguardando prestador',
  aceito: 'Aceito · aguardando pagamento',
  recusado: 'Recusado',
  em_andamento: 'Em andamento',
  aguardando_confirmacao: 'Aguardando confirmação',
  expirado: 'Concluído',
};

// Cores de status — todas do tema
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

const ContratantePedidosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [p, carteira] = await Promise.all([
        pedidosService.getPedidosForContratante(),
        getCarteira(),
      ]);
      const meus = (p || []).filter((pedido: any) => Number(pedido.contratante_id) === Number(user?.id));
      setPedidos(meus);
      setSaldo(carteira.saldo);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [user?.id]);

  // Pagamento via carteira
  const pagar = async (id: number, valor: number) => {
    const saldoAtual = saldo ?? 0;
    const temSaldo = saldoAtual >= valor;

    Alert.alert(
      'Pagar com Carteira',
      temSaldo
        ? `Valor: R$ ${valor.toFixed(2)}\nSaldo atual: R$ ${saldoAtual.toFixed(2)}\n\nO valor será debitado da sua carteira.`
        : `Saldo insuficiente!\n\nValor: R$ ${valor.toFixed(2)}\nSaldo: R$ ${saldoAtual.toFixed(2)}\n\nAdicione créditos para continuar.`,
      temSaldo
        ? [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar Pagamento',
              onPress: async () => {
                try {
                  await pedidosService.payPedido(id);
                  Alert.alert('Pago!', 'O serviço está em andamento.');
                  carregar();
                } catch (err: any) {
                  Alert.alert('Erro', err?.response?.data?.erro || 'Falha ao registrar pagamento');
                }
              },
            },
          ]
        : [
            { text: 'OK', style: 'cancel' },
            { text: '+ Adicionar créditos', onPress: () => navigation.navigate('Carteira') },
          ]
    );
  };

  const confirmarConclusao = async (id: number) => {
    Alert.alert('Confirmar Conclusão', 'Você confirma que o serviço foi concluído?', [
      { text: 'Ainda não', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await pedidosService.confirmByContratante(id);
            Alert.alert('Confirmação registrada!', 'Quando o prestador também confirmar, o pedido será finalizado.');
            carregar();
          } catch {
            Alert.alert('Erro', 'Falha ao confirmar conclusão');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Meus Pedidos</Text>
        <Text style={s.subheading}>Acompanhe o status das suas solicitações</Text>

        {/* Card de saldo */}
        {saldo !== null && (
          <TouchableOpacity style={s.saldoCard} onPress={() => navigation.navigate('Carteira')} activeOpacity={0.8}>
            <View>
              <Text style={s.saldoLabel}>SALDO DISPONÍVEL</Text>
              <Text style={s.saldoValor}>R$ {saldo.toFixed(2).replace('.', ',')}</Text>
            </View>
            <Text style={s.saldoLink}>Gerenciar →</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 20 }} />}

        {/* Estado vazio */}
        {!loading && pedidos.length === 0 && (
          <View style={s.emptyBox}>
            <View style={s.emptyIcon}><Text style={s.emptyIconTxt}>📭</Text></View>
            <Text style={s.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={s.emptyDesc}>Busque e solicite serviços para começar.</Text>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => navigation.navigate('RequisitarServico')}
              activeOpacity={0.8}
            >
              <Text style={s.btnPrimaryTxt}>BUSCAR SERVIÇOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de pedidos */}
        {pedidos.map((p) => {
          const statusLabel = STATUS_LABEL[p.status] || p.status;
          const statusCor = STATUS_COR[p.status] || C.mLow;
          const jaConfirmou = p.confirmado_contratante === 1;

          return (
            <View key={p.id} style={s.card}>
              {/* Faixa de status na lateral */}
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
                <Text style={s.cardPrestador}>👤 {p.prestador_nome || 'Prestador'}</Text>

                <Text style={s.cardValor}>R$ {Number(p.valor).toFixed(2)}</Text>

                {/* Horário agendado */}
                {p.slot_data_hora ? (
                  <Text style={s.cardSlot}>
                    📅 {formatarSlot(p.slot_data_hora)}{p.slot_duracao ? ` (${p.slot_duracao} min)` : ''}
                  </Text>
                ) : null}

                {/* Local */}
                {p.tipo_local === 'local_prestador' ? (
                  <Text style={s.cardLocal}>📍 No local do prestador</Text>
                ) : p.end_logradouro ? (
                  <Text style={s.cardLocal}>
                    📍 {p.end_label ? `${p.end_label}: ` : ''}{p.end_logradouro}, {p.end_numero} — {p.end_cidade}/{p.end_estado}
                  </Text>
                ) : null}

                {p.mensagem ? (
                  <Text style={s.cardMsg}>"{p.mensagem}"</Text>
                ) : null}

                {/* Ações */}
                <View style={s.actions}>
                  {p.status === 'aceito' && (
                    <TouchableOpacity style={s.btnPagar} onPress={() => pagar(p.id, Number(p.valor))} activeOpacity={0.8}>
                      <Text style={s.btnAcaoTxt}>💳 PAGAR COM CARTEIRA</Text>
                    </TouchableOpacity>
                  )}

                  {(p.status === 'em_andamento' || p.status === 'aguardando_confirmacao') && !jaConfirmou && (
                    <TouchableOpacity style={s.btnConfirmar} onPress={() => confirmarConclusao(p.id)} activeOpacity={0.8}>
                      <Text style={s.btnAcaoTxt}>✓ CONFIRMAR CONCLUSÃO</Text>
                    </TouchableOpacity>
                  )}

                  {p.status === 'aguardando_confirmacao' && jaConfirmou && (
                    <View style={s.aguardandoBox}>
                      <Text style={s.aguardandoTxt}>✓ Você confirmou — aguardando prestador</Text>
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
  page:     { flex: 1, backgroundColor: C.bgDeep },
  content:  { padding: S.md, paddingTop: TOP_PADDING },
  back:     { marginBottom: 14 },
  backTxt:  { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heading:  { color: C.mHigh, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 16 },

  // Card de saldo
  saldoCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrAccent,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  saldoLabel: { color: C.blue, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 4 },
  saldoValor: { color: C.cyan, fontWeight: '900', fontSize: 18 },
  saldoLink:  { color: C.blueL, fontSize: 12, fontWeight: '600' },

  // Estado vazio
  emptyBox:    { alignItems: 'center', marginTop: 48, gap: 14 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bdrBase, alignItems: 'center', justifyContent: 'center' },
  emptyIconTxt:{ fontSize: 30 },
  emptyTitle:  { color: C.mHigh, fontSize: 16, fontWeight: '700' },
  emptyDesc:   { color: C.mLow, fontSize: 13 },
  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm, borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 12, paddingHorizontal: 24, minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },

  // Cards de pedido
  card: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardSidebar: { width: 3 },
  cardBody:    { flex: 1, padding: S.md },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8, gap: 8,
  },
  cardId:   { color: C.mLow, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: R.full, borderWidth: 1, flexShrink: 1 },
  statusTxt:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  cardServico:  { color: C.mHigh, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardPrestador:{ color: C.mMid, fontSize: 12, marginBottom: 4 },
  cardValor:    { color: C.cyan, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  cardSlot:     { color: C.green, fontSize: 12, marginBottom: 3 },
  cardLocal:    { color: C.mMid, fontSize: 11, marginBottom: 3 },
  cardMsg: { color: C.mLow, fontSize: 12, fontStyle: 'italic', marginTop: 4, marginBottom: 4 },
  cardData:     { color: C.mFade, fontSize: 10, marginTop: 8 },

  // Ações
  actions: { marginTop: 10, gap: 8 },
  btnPagar: {
    backgroundColor: C.blue, borderRadius: R.sm, borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 11, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  btnConfirmar: {
    backgroundColor: C.greenDark, borderRadius: R.sm, borderWidth: 1, borderColor: C.greenBdr,
    paddingVertical: 11, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
  },
  btnAcaoTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  aguardandoBox: { backgroundColor: C.purpleDark, borderRadius: R.sm, borderWidth: 1, borderColor: C.purpleBdr, padding: 10 },
  aguardandoTxt: { color: C.purple, fontSize: 12, fontWeight: '600' },
});

export default ContratantePedidosScreen;
