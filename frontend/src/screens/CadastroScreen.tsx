import React, { useRef, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { cadastro } from '../services/auth';
import { AuthContext } from '../context/AuthContext';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const CadastroScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signIn } = useContext(AuthContext);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // Animação de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCadastro = async () => {
    if (!nome.trim()) { Alert.alert('Erro', 'Informe seu nome'); return; }
    if (!email.trim()) { Alert.alert('Erro', 'Informe seu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { Alert.alert('Erro', 'Email inválido'); return; }
    if (!senha.trim()) { Alert.alert('Erro', 'Informe uma senha'); return; }
    if (senha.length < 6) { Alert.alert('Erro', 'Mínimo 6 caracteres na senha'); return; }
    if (senha !== confirmarSenha) { Alert.alert('Erro', 'As senhas não conferem'); return; }

    try {
      setLoading(true);
      const response = await cadastro({ nome, email, senha, confirmarSenha });
      if (response.sucesso) {
        await signIn({ email, senha });
        navigation.replace('Home');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao criar conta. Tente novamente.');
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
          {/* Identificação */}
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={s.logoIconTxt}>U</Text></View>
            <View>
              <Text style={s.logoName}>UPSERV</Text>
              <Text style={s.logoSub}>NOVO CADASTRO</Text>
            </View>
          </View>

          <View style={s.divider} />

          <Text style={s.heading}>Criar conta</Text>
          <Text style={s.subheading}>Preencha os dados para se registrar na plataforma</Text>

          {/* Campo: Nome */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>NOME COMPLETO</Text>
            <TextInput
              style={s.input}
              placeholder="Seu nome"
              placeholderTextColor={C.mLow}
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />
          </View>

          {/* Campo: Email */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>EMAIL</Text>
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

          {/* Campo: Senha */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>SENHA (mín. 6 caracteres)</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.mLow}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                editable={!loading}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setMostrarSenha(!mostrarSenha)}>
                <Text style={s.eyeTxt}>{mostrarSenha ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo: Confirmar Senha */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>CONFIRMAR SENHA</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.mLow}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!mostrarConfirmar}
                editable={!loading}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setMostrarConfirmar(!mostrarConfirmar)}>
                <Text style={s.eyeTxt}>{mostrarConfirmar ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão cadastrar */}
          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleCadastro}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>CRIAR CONTA</Text>
            }
          </TouchableOpacity>

          {/* Link de login */}
          <View style={s.footerRow}>
            <Text style={s.footerTxt}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Fazer login →</Text>
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

  divider:    { height: 1, backgroundColor: C.bdrBase, marginBottom: 28 },

  heading:    { color: C.mHigh, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subheading: { color: C.mMid, fontSize: 13, marginBottom: 28, lineHeight: 19 },

  fieldBlock: { marginBottom: 18 },
  fieldLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 13,
    color: C.mHigh, fontSize: 14, minHeight: MIN_TOUCH_HEIGHT,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    backgroundColor: C.bgCard, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, height: MIN_TOUCH_HEIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  eyeTxt: { fontSize: 16 },

  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 15, alignItems: 'center',
    minHeight: MIN_TOUCH_HEIGHT, marginTop: 8,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerTxt: { color: C.mMid, fontSize: 13 },
  footerLink: { color: C.cyan, fontSize: 13, fontWeight: '700' },
});

export default CadastroScreen;
