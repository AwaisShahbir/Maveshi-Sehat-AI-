import { StyleSheet, Platform, StatusBar } from 'react-native';
import fonts from './fonts';
import { LIGHT_THEME, PALETTE } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: isDark ? colors.headerBackground : '#059669' // Signature emerald brand color
    },
    scrollContent: { 
      paddingBottom: 110 
    },

    // Header with Emerald Gradient/Solid Brand identity
    header: {
      backgroundColor: isDark ? colors.headerBackground : '#059669',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 12,
      paddingBottom: 20,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 10,
      elevation: 5,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    backButton: {
      minWidth: 42,
      minHeight: 42,
      justifyContent: 'center',
      alignItems: 'center',
    },
    refreshLocButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: { 
      fontSize: 22, 
      fontWeight: '800', 
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    headerTitleUrdu: { 
      fontFamily: fonts.urduBold, 
      fontSize: 17, 
      fontWeight: 'bold', 
      color: '#FFFFFF', 
      opacity: 0.95, 
      marginTop: 2, 
      lineHeight: 26 
    },
    headerSubtitle: { 
      fontSize: 12, 
      color: 'rgba(255,255,255,0.92)', 
      marginTop: 2,
      fontWeight: '500',
    },
    headerSubtitleUrdu: { 
      fontFamily: fonts.urduRegular, 
      fontSize: 12, 
      color: 'rgba(255,255,255,0.92)', 
      marginTop: 2, 
      lineHeight: 20 
    },

    // Urgent Heat Stress Warning Banner (High Danger)
    urgentBanner: {
      backgroundColor: '#FEF2F2',
      borderWidth: 1.5,
      borderColor: '#F87171',
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 16,
      padding: 14,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    urgentBannerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    urgentBannerTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#B91C1C',
      flex: 1,
    },
    urgentBannerDesc: {
      fontSize: 12,
      color: '#7F1D1D',
      lineHeight: 18,
      marginBottom: 10,
    },
    urgentVetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#EF4444',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    urgentVetBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },

    // Location Banner
    locationBanner: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 2,
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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationBannerLabel: {
      fontSize: 10.5,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    locationBannerValue: {
      fontSize: 14.5,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 1,
    },
    changeLocBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#A7F3D0',
      gap: 4,
    },
    changeLocBtnText: {
      fontSize: 11.5,
      fontWeight: '800',
      color: '#059669',
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

    // Main Livestock THI Dashboard Card
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
      marginBottom: 16,
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
      fontSize: 12.5, 
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
      paddingVertical: 5,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 84,
    },
    badgeBothWrap: {
      alignItems: 'center',
    },
    statusText: { fontSize: 11, fontWeight: '800' },
    statusTextSub: { fontSize: 9.5, fontWeight: '700', marginTop: 1 },

    gaugeContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    gaugeCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 8,
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
      fontWeight: '700',
    },

    gaugeDescWrap: {
      alignItems: 'center',
      marginBottom: 16,
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

    // 3 Quick Metrics Row
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metricBox: {
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceAlt : '#F8FAFC',
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: 14,
      width: '31%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricIconBg: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    metricValue: { 
      fontSize: 15, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    metricLabel: { fontSize: 9.5, color: colors.textSecondary, marginTop: 2, textAlign: 'center', fontWeight: '600' },
    metricLabelEn: { fontSize: 9.5, color: colors.textSecondary, marginTop: 2, textAlign: 'center', fontWeight: '600' },
    metricLabelUr: { fontSize: 9, color: colors.textSecondary, marginTop: 1, textAlign: 'center' },

    // 24-Hour Hourly Conditions & THI Carousel
    hourlyCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 18,
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    hourlyTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    hourlyTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    hourlySub: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    hourlyTabs: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9',
      borderRadius: 10,
      padding: 3,
      marginBottom: 12,
    },
    hourlyTabBtn: {
      flex: 1,
      paddingVertical: 5,
      borderRadius: 8,
      alignItems: 'center',
    },
    hourlyTabBtnActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    hourlyTabText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    hourlyTabTextActive: {
      color: '#059669',
      fontWeight: '800',
    },
    hourlyScrollList: {
      flexDirection: 'row',
      paddingVertical: 4,
    },
    hourlyItem: {
      alignItems: 'center',
      marginRight: 14,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: isDark ? colors.surfaceAlt : '#F8FAFC',
      minWidth: 54,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hourlyItemActive: {
      borderColor: '#059669',
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5',
    },
    hourlyItemTime: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    hourlyItemIcon: {
      marginBottom: 6,
    },
    hourlyItemVal: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    hourlyThiDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 4,
    },

    // 7-to-10 Day Forecast Card
    forecastCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 18,
      marginTop: 14,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    forecastHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    forecastTitle: { 
      fontSize: 15, 
      fontWeight: '800', 
      color: colors.textPrimary 
    },
    forecastSubtitle: { 
      fontSize: 11, 
      color: colors.textSecondary, 
    },
    forecastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    },
    forecastDay: { 
      width: 50, 
      fontSize: 12.5, 
      color: colors.textPrimary, 
      fontWeight: '700' 
    },
    forecastIconWrap: { 
      width: 32,
      alignItems: 'center',
    },
    forecastTempLow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      width: 30,
      textAlign: 'right',
    },
    barContainer: {
      flex: 1,
      height: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
      borderRadius: 3,
      marginHorizontal: 10,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    forecastTempHigh: {
      fontSize: 12.5,
      fontWeight: '800',
      color: colors.textPrimary,
      width: 32,
    },
    forecastThiBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 6,
    },
    forecastThiBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
    },

    // 8 Bioclimatic Modular Tiles (2-Column Grid)
    tilesSectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginHorizontal: 18,
      marginTop: 20,
      marginBottom: 10,
    },
    tilesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 10,
    },
    weatherTile: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      justifyContent: 'space-between',
      minHeight: 130,
    },
    tileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    tileHeaderLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    tileMainVal: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      lineHeight: 24,
    },
    tileSubText: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
      marginTop: 4,
    },
    tileAccentPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginTop: 6,
    },
    tileAccentPillText: {
      fontSize: 10,
      fontWeight: '800',
    },

    // Compass graphic in wind tile
    compassRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    compassRing: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },

    // UV Index Progress Bar
    uvProgressBar: {
      height: 5,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
      marginTop: 8,
      overflow: 'hidden',
    },
    uvProgressFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Veterinary Action Protocols Card
    advisoryCard: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.08)' : '#ECFDF5',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#A7F3D0',
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
      color: '#059669',
    },
    advisoryBodyWrap: {},
    advisoryBodyEn: {
      fontSize: 12,
      color: isDark ? colors.textSecondary : '#064E3B',
      lineHeight: 18,
    },
    advisoryDivider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#A7F3D0',
      marginVertical: 8,
    },
    advisoryBodyUr: {
      fontSize: 12.5,
      color: isDark ? colors.textSecondary : '#064E3B',
      lineHeight: 22,
      textAlign: 'right',
    },

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
      backgroundColor: '#059669',
      borderRadius: 14,
      minHeight: 46,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    autoDetectBtnText: {
      color: '#FFFFFF',
      fontSize: 13.5,
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
      backgroundColor: isDark ? colors.surfaceAlt : '#F0FDF4',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#BBF7D0',
    },
    districtChipActive: {
      backgroundColor: '#059669',
      borderColor: '#059669',
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
