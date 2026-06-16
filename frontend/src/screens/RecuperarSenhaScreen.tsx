import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { recuperarSenha } from '../services/auth';
import { C, R, S } from '../theme';
import { TOP_PADDING, MIN_TOUCH_HEIGHT } from '../utils/responsive';

export const RecuperarSenhaScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleRecuperar = async () => {
    if (!email.trim()) { Alert.alert('Erro', 'Informe seu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { Alert.alert('Erro', 'Email inválido'); return; }

    try {
      setLoading(true);
      const res = await recuperarSenha({ email });
      if (res.sucesso) setEnviado(true);
    } catch {
      Alert.alert('Erro', 'Falha ao recuperar senha. Tente novamente.');
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

        {/* Cabeçalho */}
        <Text style={s.heading}>Recuperar Senha</Text>
        <Text style={s.subheading}>
          Digite seu email para receber as instruções de redefinição
        </Text>

        {!enviado ? (
          <>
            {/* Ícone ilustrativo */}
            <View style={s.iconBox}>
              <Text style={s.iconTxt}>🔐</Text>
              <View style={s.iconGlow} />
            </View>

            {/* Campo de email */}
            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>EMAIL CADASTRADO</Text>
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

            <TouchableOpacity
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={handleRecuperar}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnTxt}>ENVIAR LINK DE RECUPERAÇÃO</Text>
              }
            </TouchableOpacity>

            <View style={s.helpBox}>
              <Text style={s.helpTxt}>
                Verifique se o email informado está correto e confira também o spam.
              </Text>
            </View>
          </>
        ) : (
          /* Estado de sucesso */
          <View style={s.successBox}>
            <View style={s.successIcon}>
              <Text style={s.successIconTxt}>✓</Text>
            </View>
            <Text style={s.successTitle}>Email enviado!</Text>
            <Text style={s.successMsg}>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </Text>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={s.btnTxt}>VOLTAR PARA LOGIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: C.bgDeep },
  content: { padding: S.lg, paddingTop: TOP_PADDING, paddingBottom: 48 },
  back:    { marginBottom: 28 },
  backTxt: { color: C.blue, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  heading:    { color: C.mHigh, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subheading: { color: C.mMid, fontSize: 13, lineHeight: 19, marginBottom: 36 },

  iconBox: {
    alignSelf: 'center', width: 90, height: 90, borderRadius: R.xl,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.bdrAccent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
    shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  iconGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    borderWidth: 1, borderColor: C.bdrGlow, opacity: 0.3,
  },
  iconTxt: { fontSize: 44 },

  fieldBlock: { marginBottom: 24 },
  fieldLabel: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: C.bgInput, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.bdrBase,
    paddingHorizontal: 14, paddingVertical: 13,
    color: C.mHigh, fontSize: 14, minHeight: MIN_TOUCH_HEIGHT,
  },

  btnPrimary: {
    backgroundColor: C.blue, borderRadius: R.sm, borderWidth: 1, borderColor: C.blueL,
    paddingVertical: 15, alignItems: 'center', minHeight: MIN_TOUCH_HEIGHT,
    shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },

  helpBox: {
    marginTop: 28, backgroundColor: C.bgCard, borderRadius: R.md,
    borderWidth: 1, borderColor: C.bdrBase, padding: S.md,
  },
  helpTxt: { color: C.mLow, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // Estado de sucesso
  successBox: { alignItems: 'center', marginTop: 20, gap: 16 },
  successIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: C.green + '22', borderWidth: 1, borderColor: C.greenBdr,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.green, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  successIconTxt: { color: C.green, fontSize: 36, fontWeight: '900' },
  successTitle: { color: C.mHigh, fontSize: 22, fontWeight: '800' },
  successMsg: {
    color: C.mMid, fontSize: 13, textAlign: 'center', lineHeight: 19,
    maxWidth: 280, marginBottom: 8,
  },
});

export default RecuperarSenhaScreen;
