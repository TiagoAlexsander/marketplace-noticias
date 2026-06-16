import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { solicitarSerPrestador } from '../services/prestadorSolicitacoes';
import { C, R, S } from '../theme';
import { scale, TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

// Tipo de cartão da grade
interface CardProps {
  icon: string;
  title: string;
  desc: string;
  accent?: string;
  variant?: 'primary' | 'default' | 'warn' | 'muted';
  onPress?: () => void;
}

// Card genérico do dashboard
const DashCard: React.FC<CardProps> = ({ icon, title, desc, variant = 'default', onPress }) => {
  const bg = {
    primary: C.blue,
    default: C.bgCard,
    warn: C.yellowDark,
    muted: C.bgCard,
  }[variant];
  const border = {
    primary: C.bdrAccent,
    default: C.bdrBase,
    warn: C.yellowBdr,
    muted: C.bdrBase,
  }[variant];

  const Wrapper: React.FC<{ children: any }> = ({ children }) =>
    onPress
      ? <TouchableOpacity style={[s.card, { backgroundColor: bg, borderColor: border }]} onPress={onPress} activeOpacity={0.8}>{children}</TouchableOpacity>
      : <View style={[s.card, { backgroundColor: bg, borderColor: border }]}>{children}</View>;

  return (
    <Wrapper>
      <Text style={s.cardIcon}>{icon}</Text>
      <Text style={[s.cardTitle, variant === 'primary' && { color: '#fff' }]}>{title}</Text>
      <Text style={[s.cardDesc, variant === 'primary' && { color: 'rgba(255,255,255,0.75)' }]}>{desc}</Text>
    </Wrapper>
  );
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, signOut } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const isPrestador = user?.role === 'prestador';
  const isUsuario = user?.role === 'usuario';

  const handleSolicitarPrestador = async () => {
    Alert.alert(
      'Virar Prestador',
      'Sua solicitação será enviada para o administrador analisar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar Solicitação',
          onPress: async () => {
            try {
              await solicitarSerPrestador('Solicitacao enviada pelo app');
              Alert.alert('Solicitação Enviada', 'O administrador irá analisar em breve.');
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível enviar.');
            }
          },
        },
      ]
    );
  };

  // Rótulo do papel
  const roleLabel = isAdmin ? 'ADMINISTRADOR' : isPrestador ? 'PRESTADOR' : 'USUÁRIO';
  const roleBg = isAdmin ? C.purpleBdr : isPrestador ? C.bdrAccent : C.bdrBase;
  const roleColor = isAdmin ? C.purple : isPrestador ? C.blueL : C.mMid;

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.content}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>PAINEL PRINCIPAL</Text>
            <Text style={s.appName}>UPSERV</Text>
            <Text style={s.appSub}>Plataforma de Serviços</Text>
          </View>
          {user && (
            <View style={[s.rolePill, { backgroundColor: roleBg + '22', borderColor: roleBg }]}>
              <Text style={[s.roleTxt, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          )}
        </View>

        {/* ── Card de boas-vindas ─────────────────────────── */}
        <View style={s.heroCard}>
          <View style={s.heroGlow} />
          <Text style={s.heroIcon}>
            {isAdmin ? '👑' : isPrestador ? '🔧' : '🏠'}
          </Text>
          <Text style={s.heroTitle}>
            {user ? `Olá, ${user.nome.split(' ')[0]}!` : 'Bem-vindo(a)!'}
          </Text>
          <Text style={s.heroDesc}>
            {isAdmin ? 'Painel do administrador — controle total da plataforma'
              : isPrestador ? 'Gerencie seus serviços e atenda clientes'
              : user ? 'Encontre serviços de qualidade na sua região'
              : 'Entre para acessar a área protegida do app.'}
          </Text>
        </View>

        {/* ── Grade de cards ──────────────────────────────── */}
        <View style={s.grid}>

          {/* ADMIN */}
          {isAdmin && <>
            <DashCard icon="📋" title="Solicitações de Prestador" desc="Aprove ou rejeite usuários." variant="primary" onPress={() => navigation.navigate('AdminSolicitacoes')} />
            <DashCard icon="🛠️" title="Aprovar Serviços" desc="Revise e publique serviços." variant="primary" onPress={() => navigation.navigate('AdminServicos')} />
            <DashCard icon="👤" title="Prestadores" desc="Gerencie prestadores." onPress={() => navigation.navigate('Prestadores')} />
            <DashCard icon="👥" title="Usuários" desc="Gerencie todos os usuários." onPress={() => navigation.navigate('Usuarios')} />
            <DashCard icon="📂" title="Todos os Serviços" desc="Visualize e gerencie serviços." onPress={() => navigation.navigate('Servicos')} />
          </>}

          {/* PRESTADOR */}
          {isPrestador && <>
            <DashCard icon="📝" title="Meus Serviços" desc="Crie e gerencie seus anúncios." variant="primary" onPress={() => navigation.navigate('Servicos')} />
            <DashCard icon="📬" title="Pedidos Recebidos" desc="Aceite ou recuse solicitações." onPress={() => navigation.navigate('PrestadorPedidos')} />
            <DashCard icon="📅" title="Minha Agenda" desc="Defina horários disponíveis." onPress={() => navigation.navigate('Slots')} />
          </>}

          {/* USUÁRIO */}
          {isUsuario && <>
            <DashCard icon="🔍" title="Buscar Serviços" desc="Encontre e requisite serviços." variant="primary" onPress={() => navigation.navigate('RequisitarServico')} />
            <DashCard icon="📥" title="Meus Pedidos" desc="Acompanhe suas solicitações." onPress={() => navigation.navigate('ContratantePedidos')} />
            <DashCard icon="❤️" title="Favoritos" desc="Serviços salvos para acesso rápido." onPress={() => navigation.navigate('Favoritos')} />
            <DashCard icon="📍" title="Meus Endereços" desc="Gerencie endereços para serviços." onPress={() => navigation.navigate('Enderecos')} />

            {user?.prestador_status === 'nenhum' && (
              <DashCard icon="⭐" title="Ser Prestador" desc="Registre-se como prestador." onPress={handleSolicitarPrestador} />
            )}
            {user?.prestador_status === 'pendente' && (
              <DashCard icon="⏳" title="Solicitação Pendente" desc="Aguardando análise do administrador." variant="warn" />
            )}
            {user?.prestador_status === 'rejeitado' && (
              <DashCard icon="❌" title="Solicitação Rejeitada" desc="Sua solicitação foi negada." variant="warn" />
            )}
          </>}

          {/* CARDS COMUNS (todos os logados) */}
          {user && <>
            <DashCard icon="💳" title="Minha Carteira" desc="Saldo fictício para pagamentos." onPress={() => navigation.navigate('Carteira')} />
            <DashCard icon="✏️" title="Editar Perfil" desc="Atualize nome, bio e foto." onPress={() => navigation.navigate('EditarPerfil')} />
          </>}

        </View>

        {/* ── Área de autenticação ────────────────────────── */}
        <View style={s.authArea}>
          {!user ? (
            <>
              <View style={s.divider} />
              <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                <Text style={s.btnPrimaryTxt}>FAZER LOGIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Cadastro')} activeOpacity={0.8}>
                <Text style={s.btnOutlineTxt}>CRIAR CONTA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('Onboarding')}>
                <Text style={s.btnGhostTxt}>Ver introdução</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Info do usuário logado */}
              <View style={s.userInfo}>
                <View style={s.userInfoItem}>
                  <Text style={s.userInfoLabel}>PERFIL</Text>
                  <Text style={s.userInfoValue}>{roleLabel}</Text>
                </View>
                <View style={s.userInfoItem}>
                  <Text style={s.userInfoLabel}>NOME</Text>
                  <Text style={s.userInfoValue} numberOfLines={1}>{user.nome.split(' ')[0]}</Text>
                </View>
              </View>
              <TouchableOpacity style={s.btnLogout} onPress={() => signOut()} activeOpacity={0.8}>
                <Text style={s.btnLogoutTxt}>SAIR DA CONTA</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Rodapé */}
        <Text style={s.footer}>v1.0.0 · UPSERV · Grupo 11</Text>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep },
  content: { padding: S.md, paddingTop: TOP_PADDING, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  eyebrow: { color: C.blue, fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 4 },
  appName: { color: C.mHigh, fontSize: scale(28), fontWeight: '900', letterSpacing: 3 },
  appSub:  { color: C.mLow, fontSize: 12, marginTop: 2 },
  rolePill: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: R.full,
    borderWidth: 1, marginTop: 4,
  },
  roleTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },

  // Hero card
  heroCard: {
    backgroundColor: C.bgCard2, borderRadius: R.lg,
    padding: S.lg, alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: C.bdrAccent,
    shadowColor: C.shadow, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: C.blue, opacity: 0.6,
  },
  heroIcon:  { fontSize: scale(36), marginBottom: 10 },
  heroTitle: { color: C.mHigh, fontSize: scale(18), fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  heroDesc:  { color: C.mMid, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // Grade 2 colunas
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  card: {
    width: '47.5%', borderRadius: R.md,
    borderWidth: 1, padding: S.md,
    minHeight: MIN_TOUCH_HEIGHT + 40,
    shadowColor: C.shadow, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  cardIcon:  { fontSize: scale(22), marginBottom: 8 },
  cardTitle: { color: C.mHigh, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardDesc:  { color: C.mMid, fontSize: 11, lineHeight: 15 },

  // Botões
  divider:  { height: 1, backgroundColor: C.bdrBase, marginBottom: 20 },
  authArea: { gap: 10, marginBottom: 20 },
  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  btnOutline: {
    borderRadius: R.sm, borderWidth: 1, borderColor: C.bdrAccent,
    paddingVertical: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
  },
  btnOutlineTxt: { color: C.blueL, fontWeight: '700', fontSize: 13, letterSpacing: 1.2 },
  btnGhost: {
    paddingVertical: 12, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT, justifyContent: 'center',
  },
  btnGhostTxt: { color: C.mLow, fontSize: 13 },

  // Info usuário logado
  userInfo: { flexDirection: 'row', gap: 10 },
  userInfoItem: {
    flex: 1, backgroundColor: C.bgCard, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center',
  },
  userInfoLabel: { color: C.mLow, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  userInfoValue: { color: C.mHigh, fontSize: 13, fontWeight: '700' },
  btnLogout: {
    backgroundColor: C.redDark, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.redBdr,
    paddingVertical: 14, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
  },
  btnLogoutTxt: { color: C.red, fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  footer: { color: C.mFade, fontSize: 10, textAlign: 'center', letterSpacing: 1 },
});

export default HomeScreen;
