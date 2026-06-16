import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, Image, Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getPerfil, atualizarPerfil, PerfilData } from '../services/perfil';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

const getAvatarUrl = (nome: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=0080FF&color=fff&size=128`;

const EditarPerfilScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { refreshUser } = useContext(AuthContext);
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await getPerfil();
      setPerfil(data);
      setNome(data.nome);
      setBio(data.bio || '');
      setFotoUrl(data.foto_url || '');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleSalvar = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome não pode ser vazio'); return; }
    setSalvando(true);
    try {
      await atualizarPerfil({ nome, bio, foto_url: fotoUrl || undefined });
      await refreshUser();
      Alert.alert('Perfil atualizado!', 'Suas informações foram salvas.');
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível salvar o perfil');
    } finally {
      setSalvando(false);
    }
  };

  const roleLabel = perfil?.role === 'admin' ? 'ADMINISTRADOR' : perfil?.role === 'prestador' ? 'PRESTADOR' : 'USUÁRIO';
  const roleColor = perfil?.role === 'admin' ? C.purple : perfil?.role === 'prestador' ? C.blueL : C.mMid;
  const avatarSrc = fotoUrl || (perfil ? getAvatarUrl(perfil.nome) : getAvatarUrl('U'));

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={C.blue} style={{ marginVertical: 40 }} />}

        {perfil && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Avatar */}
            <Animated.View style={[s.avatarArea, { transform: [{ scale: avatarScale }] }]}>
              <View style={s.avatarRing}>
                <Image source={{ uri: avatarSrc }} style={s.avatar} />
              </View>
              <View style={[s.rolePill, { borderColor: roleColor + '55' }]}>
                <Text style={[s.roleTxt, { color: roleColor }]}>{roleLabel}</Text>
              </View>
            </Animated.View>

            {/* Card de saldo */}
            <TouchableOpacity style={s.saldoCard} onPress={() => navigation.navigate('Carteira')} activeOpacity={0.8}>
              <View style={s.saldoGlow} />
              <Text style={s.saldoLabel}>SALDO NA CARTEIRA</Text>
              <Text style={s.saldoValor}>R$ {(perfil.saldo || 0).toFixed(2).replace('.', ',')}</Text>
              <Text style={s.saldoLink}>Gerenciar carteira →</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider} />

            {/* Formulário de edição */}
            <Text style={s.sectionLabel}>EDITAR INFORMAÇÕES</Text>

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>NOME</Text>
              <TextInput
                style={s.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor={C.mLow}
              />
            </View>

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>SOBRE MIM · BIO</Text>
              <TextInput
                style={[s.input, s.inputMultiline]}
                value={bio}
                onChangeText={setBio}
                placeholder="Escreva algo sobre você..."
                placeholderTextColor={C.mLow}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>URL DA FOTO</Text>
              <TextInput
                style={s.input}
                value={fotoUrl}
                onChangeText={setFotoUrl}
                placeholder="https://... (deixe vazio para usar inicial)"
                placeholderTextColor={C.mLow}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={s.fieldHint}>
                Cole a URL de uma imagem ou deixe vazio para avatar automático
              </Text>
            </View>

            <TouchableOpacity
              style={[s.salvarBtn, salvando && s.btnDisabled]}
              onPress={handleSalvar}
              disabled={salvando}
              activeOpacity={0.8}
            >
              {salvando
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.salvarTxt}>SALVAR PERFIL</Text>
              }
            </TouchableOpacity>

            {/* Informações somente leitura */}
            <View style={s.infoCard}>
              <Text style={s.infoSectionLabel}>INFORMAÇÕES DA CONTA</Text>
              <Text style={s.infoLabel}>EMAIL</Text>
              <Text style={s.infoValue}>{perfil.email}</Text>
              <View style={s.dividerLight} />
              <Text style={s.infoLabel}>MEMBRO DESDE</Text>
              <Text style={s.infoValue}>
                {new Date(perfil.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep },
  content: { padding: S.md, paddingTop: TOP_PADDING, paddingBottom: 40 },
  back:    { marginBottom: 14 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Avatar
  avatarArea: { alignItems: 'center', marginBottom: 20 },
  avatarRing: {
    padding: 3, borderRadius: 54, borderWidth: 2, borderColor: C.bdrAccent,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
    marginBottom: 10,
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  rolePill: {
    backgroundColor: C.bgCard, paddingVertical: 4, paddingHorizontal: 16,
    borderRadius: R.full, borderWidth: 1,
  },
  roleTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  // Card de saldo
  saldoCard: {
    backgroundColor: C.bgCard2, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrAccent,
    padding: S.md, marginBottom: 24, alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  saldoGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.cyan, opacity: 0.7 },
  saldoLabel: { color: C.blue, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 6 },
  saldoValor: { color: C.cyan, fontSize: 26, fontWeight: '900', marginBottom: 6 },
  saldoLink:  { color: C.blueL, fontSize: 12, fontWeight: '600' },

  divider:      { height: 1, backgroundColor: C.bdrBase, marginBottom: 20 },
  dividerLight: { height: 1, backgroundColor: C.bdrBase, marginVertical: 12 },

  sectionLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },

  fieldBlock: { marginBottom: 16 },
  fieldLabel: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  fieldHint:  { color: C.mLow, fontSize: 11, marginTop: 5 },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.mHigh, fontSize: 14, minHeight: MIN_TOUCH_HEIGHT,
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },

  salvarBtn: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 24, minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  salvarTxt:   { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },

  // Informações somente leitura
  infoCard: {
    backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase, padding: S.md,
  },
  infoSectionLabel: { color: C.blue, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  infoLabel: { color: C.mLow, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { color: C.mHigh, fontSize: 14 },
});

export default EditarPerfilScreen;
