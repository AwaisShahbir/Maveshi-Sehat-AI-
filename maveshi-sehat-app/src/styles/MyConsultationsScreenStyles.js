import { StyleSheet, Platform, StatusBar } from 'react-native';
import { LIGHT_THEME, PALETTE } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: isDark ? colors.headerBackground : colors.primary 
    },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 18, 
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 14,
      paddingBottom: 16,
      backgroundColor: isDark ? colors.headerBackground : colors.primary,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 10,
      elevation: 5,
    },
    backBtn: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: { 
      fontSize: 18, 
      fontWeight: '800', 
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    card: { 
      backgroundColor: colors.card, 
      borderRadius: 18, 
      padding: 16, 
      marginBottom: 14, 
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    headerRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 12 
    },
    vetName: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    typeText: { 
      fontSize: 13, 
      color: colors.textSecondary, 
      marginTop: 3 
    },
    statusBadge: { 
      paddingHorizontal: 10, 
      paddingVertical: 5, 
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    statusText: { 
      fontSize: 11, 
      fontWeight: '800' 
    },
    reasonText: { 
      fontSize: 14, 
      color: colors.textPrimary, 
      marginBottom: 8,
      lineHeight: 20,
    },
    dateText: { 
      fontSize: 13, 
      color: PALETTE.amber500, 
      fontWeight: '700', 
      marginBottom: 12 
    },
    chatBtn: { 
      backgroundColor: colors.primary, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: 48,
      borderRadius: 14, 
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    chatBtnText: { 
      color: '#FFFFFF', 
      fontWeight: '800',
      fontSize: 14,
    },
    emptyState: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: { 
      marginTop: 14, 
      fontSize: 16, 
      color: colors.textSecondary,
      fontWeight: '600',
    }
  });
};

export default getStyles();
