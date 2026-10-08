/**
 * Maveshi Sehat AI — Unified Design Tokens & Color Palette
 * Complies with Human-Computer Interaction (HCI) principles and WCAG AA contrast standards.
 */

export const PALETTE = {
  // Emerald / Primary Green (Livestock & Health)
  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065F46',
  emerald900: '#064E3B',

  // Cobalt / Royal Blue (Consultations, Telehealth, Doctor)
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue900: '#1E3A8A',

  // Sunset Amber (Alerts, Heat Stress, Moderate Risk)
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  amber900: '#78350F',

  // Coral / Crimson Red (Critical, High Risk, Danger)
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
  red900: '#7F1D1D',

  // Amethyst / Purple (Marketplace, Records, Transactions)
  purple50: '#F5F3FF',
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple700: '#6D28D9',
  purple900: '#4C1D95',

  // Cyan / Teal (Metrics, Diagnostics)
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',

  // Neutral Slate Scales
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate850: '#162235',
  slate900: '#0F172A',
  slate950: '#0B1120',

  white: '#FFFFFF',
  black: '#000000',
};

export const LIGHT_THEME = {
  isDark: false,
  background: PALETTE.slate50,
  card: PALETTE.white,
  cardElevated: PALETTE.slate50,
  cardHover: PALETTE.slate100,
  border: PALETTE.slate200,
  borderLight: '#EDF2F7',

  textPrimary: PALETTE.slate900,
  textSecondary: PALETTE.slate600,
  textMuted: PALETTE.slate400,
  textInverse: PALETTE.white,

  primary: PALETTE.emerald600,
  primaryLight: PALETTE.emerald50,
  primaryBorder: PALETTE.emerald200,
  primaryGradient: ['#059669', '#10B981'],

  secondary: PALETTE.blue600,
  secondaryLight: PALETTE.blue50,
  secondaryBorder: PALETTE.blue200,

  accentAmber: PALETTE.amber600,
  accentAmberLight: PALETTE.amber50,
  accentAmberBorder: PALETTE.amber200,

  accentPurple: PALETTE.purple600,
  accentPurpleLight: PALETTE.purple50,
  accentPurpleBorder: PALETTE.purple200,

  accentRed: PALETTE.red600,
  accentRedLight: PALETTE.red50,
  accentRedBorder: PALETTE.red200,

  accentTeal: PALETTE.teal600,
  accentTealLight: PALETTE.teal50,

  headerBackground: PALETTE.emerald600,
  headerText: PALETTE.white,
  navBackground: PALETTE.white,
  navBorder: PALETTE.slate200,
  navActive: PALETTE.emerald600,
  navInactive: PALETTE.slate400,

  inputBackground: PALETTE.white,
  inputBorder: PALETTE.slate200,
  inputText: PALETTE.slate900,
  inputPlaceholder: PALETTE.slate400,

  statusBar: 'light-content',
};

export const DARK_THEME = {
  isDark: true,
  background: PALETTE.slate950,
  card: PALETTE.slate800,
  cardElevated: PALETTE.slate850,
  cardHover: PALETTE.slate700,
  border: PALETTE.slate700,
  borderLight: '#253346',

  textPrimary: PALETTE.slate50,
  textSecondary: PALETTE.slate300,
  textMuted: PALETTE.slate400,
  textInverse: PALETTE.slate900,

  primary: PALETTE.emerald400,
  primaryLight: 'rgba(16, 185, 129, 0.15)',
  primaryBorder: 'rgba(52, 211, 153, 0.3)',
  primaryGradient: ['#065F46', '#059669'],

  secondary: PALETTE.blue400,
  secondaryLight: 'rgba(59, 130, 246, 0.15)',
  secondaryBorder: 'rgba(96, 165, 250, 0.3)',

  accentAmber: PALETTE.amber400,
  accentAmberLight: 'rgba(245, 158, 11, 0.15)',
  accentAmberBorder: 'rgba(251, 191, 36, 0.3)',

  accentPurple: PALETTE.purple400,
  accentPurpleLight: 'rgba(139, 92, 246, 0.15)',
  accentPurpleBorder: 'rgba(167, 139, 250, 0.3)',

  accentRed: PALETTE.red400,
  accentRedLight: 'rgba(239, 68, 68, 0.15)',
  accentRedBorder: 'rgba(248, 113, 113, 0.3)',

  accentTeal: PALETTE.teal400,
  accentTealLight: 'rgba(20, 184, 166, 0.15)',

  headerBackground: PALETTE.slate900,
  headerText: PALETTE.slate50,
  navBackground: PALETTE.slate900,
  navBorder: PALETTE.slate800,
  navActive: PALETTE.emerald400,
  navInactive: PALETTE.slate500,

  inputBackground: PALETTE.slate850,
  inputBorder: PALETTE.slate700,
  inputText: PALETTE.slate50,
  inputPlaceholder: PALETTE.slate500,

  statusBar: 'light-content',
};

export const HCI = {
  minTouchSize: 48,
  borderRadiusSmall: 10,
  borderRadiusMedium: 16,
  borderRadiusLarge: 24,
  borderRadiusPill: 999,
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
  spacingXl: 32,
};
