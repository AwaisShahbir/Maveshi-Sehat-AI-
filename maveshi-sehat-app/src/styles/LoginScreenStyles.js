import { StyleSheet, Platform } from 'react-native';
import fonts from './fonts';
import { LIGHT_THEME } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? colors.headerBackground : colors.primary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    topSection: {
      backgroundColor: isDark ? colors.headerBackground : colors.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 40 : 16,
      paddingBottom: 70,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      minWidth: 44,
      minHeight: 44,
    },
    backText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 4,
    },
    mainTitle: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: '800',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    urduTitle: {
      color: '#FFFFFF',
      fontSize: 24,
      fontFamily: fonts.urduBold,
      lineHeight: 40,
    },
    cardContainer: {
      backgroundColor: colors.card,
      marginHorizontal: 20,
      borderRadius: 24,
      padding: 24,
      marginTop: -40,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 14,
      elevation: 5,
      marginBottom: 40,
    },
    label: {
      fontSize: 13,
      color: colors.textPrimary,
      marginBottom: 10,
      fontWeight: '700',
      marginTop: 20,
    },
    roleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    roleButton: {
      flex: 1,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.cardElevated,
    },
    roleButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    roleText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },
    roleTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: colors.inputText,
    },
    eyeIcon: {
      padding: 8,
    },
    forgotPassword: {
      color: colors.primary,
      fontSize: 13,
      marginTop: 16,
      marginBottom: 28,
      fontWeight: '700',
    },
    loginButton: {
      backgroundColor: colors.primary,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 20,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : '#FECACA',
    },
    errorText: {
      color: isDark ? '#F87171' : '#DC2626',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 16,
    },
    registerText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    registerLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
  });
};

const defaultStyles = getStyles(LIGHT_THEME, false);
export default defaultStyles;
