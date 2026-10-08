import { StyleSheet, Platform, StatusBar } from 'react-native';
import fonts from './fonts';
import { LIGHT_THEME, PALETTE } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    scrollContent: { 
      paddingBottom: 90 
    },

    header: {
      backgroundColor: isDark ? colors.headerBackground : PALETTE.amber500,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 14,
      paddingBottom: 24,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    backButton: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshLocButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: { 
      fontSize: 24, 
      fontWeight: '800', 
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    headerTitleUrdu: { 
      fontFamily: fonts.urduBold, 
      fontSize: 18, 
      fontWeight: 'bold', 
      color: '#FFFFFF', 
      opacity: 0.95, 
      marginTop: 2, 
      lineHeight: 28 
    },
    headerSubtitle: { 
      fontSize: 12, 
      color: 'rgba(255,255,255,0.92)', 
      marginTop: 2,
      fontWeight: '500',
    },
    headerSubtitleUrdu: { 
      fontFamily: fonts.urduRegular, 
      fontSize: 13, 
      color: 'rgba(255,255,255,0.92)', 
      marginTop: 2, 
      lineHeight: 22 
    },

    locationBanner: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    locationIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF5E5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationBannerLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    locationBannerValue: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    changeLocBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFF5E5',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FFE2B8',
      gap: 5,
      minHeight: 40,
    },
    changeLocBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: PALETTE.amber500,
    },

    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },

    mainCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 18,
      marginTop: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 18,
    },
    cardHeaderLeft: {
      flex: 1,
      marginRight: 10,
    },
    cardTitle: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    cardTitleSubUrdu: { 
      fontSize: 13, 
      fontWeight: '600', 
      color: colors.textSecondary, 
      marginTop: 1 
    },
    cardSubtitle: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      marginTop: 2 
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 84,
    },
    badgeBothWrap: {
      alignItems: 'center',
    },
    statusText: { fontSize: 11, fontWeight: '800' },
    statusTextSub: { fontSize: 10, fontWeight: '700', marginTop: 1 },

    gaugeContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },
    gaugeCircle: {
      width: 134,
      height: 134,
      borderRadius: 67,
      borderWidth: 9,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    gaugeValue: { 
      fontSize: 38, 
      fontWeight: '900',
      color: colors.textPrimary,
    },
    gaugeLabel: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      marginTop: -2,
      fontWeight: '600',
    },

    gaugeDescWrap: {
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    gaugeDescEn: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    gaugeDescUr: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 2,
    },

    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metricBox: {
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : '#F7F9F8',
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 16,
      width: '31%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    metricValue: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    metricLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    metricLabelEn: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    metricLabelUr: { fontSize: 9, color: colors.textSecondary, marginTop: 1, textAlign: 'center' },

    advisoryCard: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFF9F0',
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FFE2B8',
    },
    advisoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    advisoryTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#FBBF24' : '#C67A00',
    },
    advisoryBodyWrap: {},
    advisoryBodyEn: {
      fontSize: 12,
      color: isDark ? colors.textSecondary : '#664400',
      lineHeight: 18,
    },
    advisoryDivider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFE2B8',
      marginVertical: 8,
    },
    advisoryBodyUr: {
      fontSize: 13,
      color: isDark ? colors.textSecondary : '#664400',
      lineHeight: 24,
      textAlign: 'right',
    },

    forecastHeaderRow: {
      marginBottom: 16,
    },
    forecastTitle: { 
      fontSize: 16, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    forecastSubtitle: { 
      fontSize: 11, 
      color: colors.textSecondary, 
      marginTop: 2 
    },
    forecastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    forecastDay: { 
      width: 44, 
      fontSize: 13, 
      color: colors.textPrimary, 
      fontWeight: '600' 
    },
    forecastIcon: { width: 28 },
    barContainer: {
      flex: 1,
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0',
      borderRadius: 3,
      marginHorizontal: 10,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    forecastRight: { width: 62, alignItems: 'flex-end' },
    forecastTemp: { 
      fontSize: 13, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    forecastThi: { fontSize: 10, fontWeight: '700' },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      maxHeight: '80%',
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    autoDetectBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 14,
      minHeight: 48,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    autoDetectBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.inputText,
      paddingVertical: 4,
    },
    searchResultsBox: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      maxHeight: 180,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchResultName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    searchResultSub: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 6,
      marginBottom: 10,
    },
    chipsScroll: {
      maxHeight: 180,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingBottom: 10,
    },
    districtChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : '#F0F4F2',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    districtChipActive: {
      backgroundColor: PALETTE.amber500,
      borderColor: PALETTE.amber500,
    },
    districtChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    districtChipTextActive: {
      color: '#FFFFFF',
    },

    bottomNavContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bottomNav,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,
      elevation: 10,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 14,
      paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    },
    navItem: { alignItems: 'center' },
    navText: { fontSize: 10, color: colors.navText, marginTop: 4, fontWeight: '700' },
  });
};

export default getStyles();
