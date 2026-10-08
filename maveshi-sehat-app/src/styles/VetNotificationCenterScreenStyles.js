import { StyleSheet, Platform, StatusBar } from 'react-native';
import { LIGHT_THEME, PALETTE } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: colors.background, 
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
    },
    header: { 
      backgroundColor: isDark ? colors.headerBackground : colors.primary, 
      paddingHorizontal: 20, 
      paddingTop: 12, 
      paddingBottom: 22,
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
    headerTopRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginBottom: 18 
    },
    backBtn: { 
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
    settingsBtn: { 
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { 
      flex: 1, 
      backgroundColor: colors.card, 
      borderRadius: 16, 
      paddingVertical: 12, 
      marginHorizontal: 4, 
      alignItems: 'center',
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
    tabsContainer: { 
      backgroundColor: colors.card, 
      paddingVertical: 10, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border 
    },
    tabsScroll: { paddingHorizontal: 15 },
    tabBtn: { 
      paddingVertical: 8, 
      paddingHorizontal: 16, 
      borderRadius: 20, 
      backgroundColor: colors.surfaceAlt, 
      marginRight: 10,
      minHeight: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBtnActive: { 
      backgroundColor: colors.card, 
      borderWidth: 1.5, 
      borderColor: colors.primary 
    },
    tabText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
    tabTextActive: { color: colors.primary },
    unreadTabBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', position: 'absolute', top: 0, right: -8 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    listHeaderText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    listHeaderActions: { flexDirection: 'row' },
    headerActionBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 36, paddingHorizontal: 8 },
    headerActionText: { fontSize: 12, fontWeight: '700', marginLeft: 4, color: colors.primary },
    listContainer: { paddingHorizontal: 16, paddingBottom: 40 },
    notificationCard: { 
      backgroundColor: colors.card, 
      borderRadius: 18, 
      padding: 16, 
      marginBottom: 12, 
      position: 'relative', 
      elevation: 2, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: isDark ? 0.25 : 0.05, 
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.primary },
    unreadDot: { position: 'absolute', top: 16, left: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    notificationTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    unreadTitle: { fontWeight: '800' },
    notificationMessage: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
    notificationUrdu: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
    typeBadgeText: { fontSize: 10, fontWeight: 'bold' },
    footerRight: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 12, color: colors.textSecondary, marginRight: 12 },
    actionBtnText: { fontSize: 13, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16, color: colors.textSecondary, fontWeight: '600' }
  });
};

export default getStyles();
