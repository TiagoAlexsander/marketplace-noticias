import React, { useRef, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { signIn } = useContext(AuthContext);

  // Animação de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Acesso negado', 'Preencha email e senha para continuar.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Formato de email inválido.');
      return;
    }
    try {
      setLoading(true);
      await signIn({ email, senha });
      navigation.replace('Home');
    } catch {
      Alert.alert('Falha de autenticação', 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Voltar</Text>
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logotipo / identificação do terminal */}
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={s.logoIconTxt}>U</Text></View>
            <View>
              <Text style={s.logoName}>UPSERV</Text>
              <Text style={s.logoSub}>TERMINAL DE ACESSO</Text>
            </View>
          </View>

          {/* Divider decorativo */}
          <View style={s.divider} />

          <Text style={s.heading}>Autenticação</Text>
          <Text style={s.subheading}>Insira suas credenciais para acessar o sistema</Text>

          {/* Campos */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>IDENTIFICADOR · EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="usuario@dominio.com"
              placeholderTextColor={C.mLow}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>CHAVE DE ACESSO · SENHA</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={C.mLow}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                editable={!loading}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setMostrarSenha(!mostrarSenha)}
              >
                <Text style={s.eyeTxt}>{mostrarSenha ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={s.forgotLink}
            onPress={() => navigation.navigate('RecuperarSenha')}
          >
            <Text style={s.forgotTxt}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {/* Botão de login */}
          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>ACESSAR SISTEMA</Text>
            }
          </TouchableOpacity>

          {/* Linha divisória */}
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orTxt}>ou</Text>
            <View style={s.orLine} />
          </View>

          {/* Link de cadastro */}
          <View style={s.footerRow}>
            <Text style={s.footerTxt}>Novo usuário? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={s.footerLink}>Criar conta →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: C.bgDeep },
  content:    { padding: S.lg, paddingTop: TOP_PADDING, paddingBottom: 48 },
  back:       { marginBottom: 32 },
  backTxt:    { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  logoIcon: {
    width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.blue,
    borderWidth: 1, borderColor: C.blueL, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.blue, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  logoIconTxt: { color: '#fff', fontSize: 22, fontWeight: '900' },
  logoName:   { color: C.mHigh, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  logoSub:    { color: C.mLow, fontSize: 9, letterSpacing: 2, marginTop: 2 },

  divider: {
    height: 1, backgroundColor: C.bdrBase, marginBottom: 28,
  },

  heading:    { color: C.mHigh, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 28, lineHeight: 19 },

  fieldBlock: { marginBottom: 20 },
  fieldLabel: {
    color: C.blue, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 8,
  },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 13,
    color: C.mHigh, fontSize: 14, marginBottom: 0,
    minHeight: MIN_TOUCH_HEIGHT,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: C.bgCard, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, height: MIN_TOUCH_HEIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  eyeTxt: { fontSize: 16 },

  forgotLink: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotTxt: { color: C.blueL, fontSize: 12, fontWeight: '600' },

  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 15, alignItems: 'center',
    minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: C.bdrBase },
  orTxt: { color: C.mLow, fontSize: 12 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerTxt: { color: C.mMid, fontSize: 13 },
  footerLink: { color: C.cyan, fontSize: 13, fontWeight: '700' },
});

export default LoginScreen;
