import { StyleSheet, Platform, StatusBar } from 'react-native';
import fonts from './fonts';
import { LIGHT_THEME } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 26,
      justifyContent: 'space-between',
    },

    /* ── Top section ── */
    topSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 20,
    },
    badge: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 28,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 1.5,
    },
    logoCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.3)',
      marginBottom: 24,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    logoImage: {
      width: 140,
      height: 140,
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    urduTitle: {
      fontFamily: fonts.urduBold,
      fontSize: 24,
      fontWeight: '800',
      color: '#6EE7B7',
      marginBottom: 16,
      textAlign: 'center',
      lineHeight: 40,
    },
    englishSub: {
      fontSize: 13.5,
      color: 'rgba(255,255,255,0.92)',
      marginBottom: 4,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 20,
    },
    urduSub: {
      fontFamily: fonts.urduRegular,
      fontSize: 14,
      color: 'rgba(255,255,255,0.95)',
      textAlign: 'center',
      lineHeight: 28,
    },

    /* ── Bottom section ── */
    bottomSection: {
      paddingBottom: 36,
    },
    loginBtn: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      minHeight: 54,
      justifyContent: 'center',
    },
    loginText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#059669',
    },
    registerBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 20,
      minHeight: 54,
      justifyContent: 'center',
    },
    registerText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    trustText: {
      textAlign: 'center',
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
    },

    /* ── Language Selection Modal ── */
    langBadgeBtn: {
      position: 'absolute',
      top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      zIndex: 999,
      elevation: 8,
      minHeight: 40,
    },
    langBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalHandle: {
      width: 44,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 20,
    },
    langOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 12,
      backgroundColor: colors.cardElevated,
      minHeight: 54,
    },
    langOptionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    langCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    langFlag: {
      fontSize: 24,
      marginRight: 14,
    },
    langCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    langCardTitleSelected: {
      fontWeight: '800',
      color: colors.primary,
    },
    langCardSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
};

const defaultStyles = getStyles(LIGHT_THEME, false);
export default defaultStyles;
