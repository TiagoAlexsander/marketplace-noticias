/**
 * UPSERV — Design System / Tokens
 * Tema: Azul Escuro Metálico · Tecnológico
 */

export const C = {
  // ── Fundos ──────────────────────────────────────
  bgDeep:   '#020A14',   // página principal (quase preto-azul)
  bgBase:   '#040F1C',   // fundo alternativo
  bgCard:   '#071A2C',   // card padrão
  bgCard2:  '#0A2236',   // card elevado / destaque
  bgInput:  '#030D18',   // inputs
  bgDivide: '#0D2438',   // separadores / headers internos

  // ── Escala metálica (texto) ──────────────────────
  mHigh: '#C8DCEC',   // títulos / texto principal
  mMid:  '#7AA0B8',   // corpo de texto
  mLow:  '#3E6480',   // texto secundário / dica
  mFade: '#1E3248',   // desabilitado

  // ── Azul elétrico ───────────────────────────────
  blue:    '#0080FF',  // ação primária
  blueL:   '#00AAFF',  // destaque / hover
  blueDark:'#003A7A',  // botão dark
  cyan:    '#00D4FF',  // valores / dados (preços, números)
  cyanDim: '#006688',  // cyan escuro

  // ── Bordas ──────────────────────────────────────
  bdrBase: 'rgba(50,120,190,0.22)',   // borda padrão
  bdrAccent:'rgba(0,128,255,0.40)',   // borda acento
  bdrGlow: 'rgba(0,200,255,0.55)',    // borda com brilho
  bdrMetal:'rgba(180,220,255,0.10)',  // brilho metálico sutil

  // ── Status ──────────────────────────────────────
  green:      '#00E688',
  greenDark:  '#003A1E',
  greenBdr:   'rgba(0,230,136,0.3)',

  yellow:     '#FFB300',
  yellowDark: '#3A2800',
  yellowBdr:  'rgba(255,179,0,0.3)',

  red:        '#FF2040',
  redDark:    '#3A0010',
  redBdr:     'rgba(255,32,64,0.3)',

  purple:     '#7C4DFF',
  purpleDark: '#1A0F40',
  purpleBdr:  'rgba(124,77,255,0.3)',

  // ── Sombra ──────────────────────────────────────
  shadow: '#0050CC',
} as const;

// Raios de borda — mais angulares = mais "tech"
export const R = {
  xs: 3,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
  full: 999,
} as const;

// Espaçamento
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Tipografia utilitária
export const T = {
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  hero: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
} as const;

// Estilo padrão de card
export const cardStyle = {
  backgroundColor: C.bgCard,
  borderRadius: R.md,
  borderWidth: 1,
  borderColor: C.bdrBase,
  padding: S.md,
} as const;

// Estilo padrão de input
export const inputStyle = {
  backgroundColor: C.bgInput,
  borderRadius: R.sm,
  borderWidth: 1,
  borderColor: C.bdrBase,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: C.mHigh,
  fontSize: 14,
} as const;

// Botão primário
export const btnPrimary = {
  backgroundColor: C.blue,
  borderRadius: R.sm,
  borderWidth: 1,
  borderColor: C.blueL,
  paddingVertical: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;

// Botão outline
export const btnOutline = {
  backgroundColor: 'transparent',
  borderRadius: R.sm,
  borderWidth: 1,
  borderColor: C.bdrAccent,
  paddingVertical: 13,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
} as const;
