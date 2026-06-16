import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import { listarMeusSlots, criarSlot, removerSlot, Slot } from '../services/slots';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

// Gera os próximos 14 dias
const gerarDias = () => {
  const dias = [];
  const hoje = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    dias.push(d);
  }
  return dias;
};

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
];

const formatarDataHora = (dataHora: string) =>
  new Date(dataHora).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const SlotsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const fadeAnimValue = useRef(new Animated.Value(0)).current;

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await listarMeusSlots();
      setSlots(lista);
      Animated.timing(fadeAnimValue, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleCriar = async () => {
    if (!diaSelecionado || !horarioSelecionado) {
      Alert.alert('Atenção', 'Selecione o dia e o horário');
      return;
    }
    const [h, m] = horarioSelecionado.split(':');
    const data = new Date(diaSelecionado);
    data.setHours(parseInt(h), parseInt(m), 0, 0);
    const iso = data.toISOString().slice(0, 16) + ':00';

    setCriando(true);
    try {
      await criarSlot(iso);
      Alert.alert('Slot criado!', formatarDataHora(iso));
      setDiaSelecionado(null);
      setHorarioSelecionado(null);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível criar o slot');
    } finally {
      setCriando(false);
    }
  };

  const handleRemover = (id: number) => {
    Alert.alert('Remover slot?', 'Confirma a remoção deste horário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await removerSlot(id);
            carregar();
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o slot');
          }
        },
      },
    ]);
  };

  const dias = gerarDias();

  // Horários já cadastrados para o dia selecionado
  const horariosOcupados = slots
    .filter((sl) => {
      if (!diaSelecionado) return false;
      const d = new Date(sl.data_hora);
      return d.getDate() === diaSelecionado.getDate() && d.getMonth() === diaSelecionado.getMonth();
    })
    .map((sl) => {
      const d = new Date(sl.data_hora);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

  return (
    <ScrollView style={s.page}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={s.heading}>Minha Agenda</Text>
        <Text style={s.subheading}>Defina seus horários disponíveis para atender clientes</Text>

        {/* Passo 1: Escolha o dia */}
        <Text style={s.stepLabel}>01 · ESCOLHA O DIA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.diasScroll}>
          {dias.map((d, i) => {
            const sel = diaSelecionado?.toDateString() === d.toDateString();
            const hoje = i === 0;
            return (
              <TouchableOpacity
                key={i}
                style={[s.diaChip, sel && s.diaChipSel]}
                onPress={() => { setDiaSelecionado(d); setHorarioSelecionado(null); }}
                activeOpacity={0.7}
              >
                <Text style={[s.diaNome, sel && s.diaTextSel]}>
                  {hoje ? 'HOJE' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}
                </Text>
                <Text style={[s.diaNum, sel && s.diaTextSel]}>{d.getDate()}</Text>
                <Text style={[s.diaMes, sel && s.diaTextSel]}>
                  {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Passo 2: Escolha o horário */}
        {diaSelecionado && (
          <>
            <Text style={[s.stepLabel, { marginTop: 20 }]}>02 · ESCOLHA O HORÁRIO</Text>
            <View style={s.horariosGrid}>
              {HORARIOS.map((h) => {
                const ocupado = horariosOcupados.includes(h);
                const sel = horarioSelecionado === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      s.horarioChip,
                      sel && s.horarioSel,
                      ocupado && s.horarioOcupado,
                    ]}
                    onPress={() => !ocupado && setHorarioSelecionado(h)}
                    disabled={ocupado}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      s.horarioTxt,
                      sel && s.horarioTxtSel,
                      ocupado && s.horarioTxtOcupado,
                    ]}>{h}</Text>
                    {ocupado && <Text style={s.ocupadoMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Botão criar slot */}
        {diaSelecionado && horarioSelecionado && (
          <TouchableOpacity
            style={[s.criarBtn, criando && s.btnDisabled]}
            onPress={handleCriar}
            disabled={criando}
            activeOpacity={0.8}
          >
            {criando
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.criarTxt}>
                  ADICIONAR {horarioSelecionado} · {diaSelecionado.getDate()}/{diaSelecionado.getMonth() + 1}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* Lista de slots cadastrados */}
        <View style={s.divider} />
        <Text style={s.stepLabel}>HORÁRIOS CADASTRADOS ({slots.length})</Text>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 10 }} />}

        {!loading && slots.length === 0 && (
          <Text style={s.emptyTxt}>Nenhum horário cadastrado ainda</Text>
        )}

        <Animated.View style={{ opacity: fadeAnimValue }}>
          {slots.map((sl) => (
            <View key={sl.id} style={[s.slotCard, sl.disponivel === 0 && s.slotOcupado]}>
              <View>
                <Text style={s.slotData}>{formatarDataHora(sl.data_hora)}</Text>
                <Text style={s.slotDuracao}>{sl.duracao_minutos} minutos</Text>
                <Text style={[s.slotStatus, sl.disponivel === 1 ? s.statusLivre : s.statusReservado]}>
                  {sl.disponivel === 1 ? '● DISPONÍVEL' : '● RESERVADO'}
                </Text>
              </View>
              {sl.disponivel === 1 && (
                <TouchableOpacity style={s.removerBtn} onPress={() => handleRemover(sl.id)}>
                  <Text style={s.removerTxt}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Animated.View>
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
  subheading: { color: C.mMid, fontSize: 13, lineHeight: 18, marginBottom: 20 },
  stepLabel:  { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },

  // Seletor de dias
  diasScroll: { marginBottom: 4 },
  diaChip: {
    backgroundColor: C.bgCard, borderRadius: R.md, padding: 10,
    marginRight: 8, alignItems: 'center', minWidth: 54,
    borderWidth: 1, borderColor: C.bdrBase,
  },
  diaChipSel: { borderColor: C.blue, backgroundColor: C.bgCard2, shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  diaNome: { color: C.mLow, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  diaNum:  { color: C.mHigh, fontSize: 20, fontWeight: '800', marginVertical: 2 },
  diaMes:  { color: C.mLow, fontSize: 9, letterSpacing: 0.5 },
  diaTextSel: { color: C.blueL },

  // Grid de horários
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  horarioChip: {
    backgroundColor: C.bgCard, borderRadius: R.sm,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.bdrBase, alignItems: 'center',
  },
  horarioSel: { borderColor: C.green, backgroundColor: C.greenDark, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  horarioOcupado: { backgroundColor: C.bgBase, borderColor: C.bdrBase, opacity: 0.4 },
  horarioTxt: { color: C.mHigh, fontWeight: '600', fontSize: 13 },
  horarioTxtSel: { color: C.green },
  horarioTxtOcupado: { color: C.mLow },
  ocupadoMark: { color: C.blue, fontSize: 9, marginTop: 2 },

  // Botão criar
  criarBtn: {
    backgroundColor: C.green + 'CC', borderRadius: R.sm,
    borderWidth: 1, borderColor: C.greenBdr,
    padding: 14, alignItems: 'center', marginBottom: 8, minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.5 },
  criarTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1.2 },

  divider: { height: 1, backgroundColor: C.bdrBase, marginVertical: 20 },

  // Cards de slots
  slotCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase,
    padding: S.md, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  slotOcupado: { backgroundColor: C.bgBase, borderColor: C.bdrBase, opacity: 0.7 },
  slotData:    { color: C.mHigh, fontWeight: '700', fontSize: 14 },
  slotDuracao: { color: C.mMid, fontSize: 11, marginTop: 2 },
  slotStatus:  { fontSize: 10, marginTop: 6, fontWeight: '700', letterSpacing: 1 },
  statusLivre:    { color: C.green },
  statusReservado:{ color: C.yellow },
  removerBtn: {
    backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr, padding: 8,
  },
  removerTxt: { color: C.red, fontSize: 12, fontWeight: '700' },
  emptyTxt:   { color: C.mLow, textAlign: 'center', marginTop: 20 },
});

export default SlotsScreen;
