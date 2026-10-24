import { StyleSheet, Platform, StatusBar } from 'react-native';
import { LIGHT_THEME, PALETTE } from '../utils/theme';

export const getStyles = (colors = LIGHT_THEME, isDark = false) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? colors.headerBackground : colors.primary,
    },
    mainContainer: {
      flex: 1,
      backgroundColor: isDark ? colors.background : '#F8FAFC',
    },
    headerContainer: {
      backgroundColor: isDark ? colors.headerBackground : colors.primary,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 14,
      paddingBottom: 20,
      borderBottomWidth: isDark ? 1 : 0,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 10,
      elevation: 6,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 13,
      marginTop: 2,
      fontWeight: '500',
    },
    addButton: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
      marginLeft: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)',
      borderRadius: 16,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 12,
      minHeight: 42,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    activeTab: {
      backgroundColor: isDark ? colors.card : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
    },
    activeTabText: {
      color: isDark ? colors.textPrimary : colors.primary,
    },
    tabBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    activeTabBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#E8F8EA',
    },
    tabBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    activeTabBadgeText: {
      color: colors.primary,
    },

    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 110,
    },

    // Guide Banner
    guideBanner: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
      padding: 14,
      marginBottom: 16,
    },
    guideHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    guideTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    guideTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#93C5FD' : '#1D4ED8',
    },
    guideBody: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
      gap: 6,
    },
    guideItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    guideItemPeriod: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#93C5FD' : '#2563EB',
      width: 85,
    },
    guideItemText: {
      fontSize: 12,
      color: isDark ? colors.textSecondary : '#334155',
      flex: 1,
    },

    // Vaccine Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconUpcoming: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
    },
    iconCompleted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA',
    },
    iconOverdue: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
    },
    titleContainer: {
      flex: 1,
    },
    vaccineTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    tagPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    vetTagPill: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
    },
    vetTagText: {
      color: isDark ? '#93C5FD' : '#2563EB',
      fontWeight: '700',
    },

    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusUpcoming: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
    },
    statusCompleted: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#E8F8EA',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A3E6B2',
    },
    statusOverdue: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
    },
    statusTextUpcoming: {
      color: isDark ? '#FBBF24' : '#D97706',
      fontSize: 11,
      fontWeight: '800',
    },
    statusTextCompleted: {
      color: isDark ? '#34D399' : '#059669',
      fontSize: 11,
      fontWeight: '800',
    },
    statusTextOverdue: {
      color: isDark ? '#F87171' : '#DC2626',
      fontSize: 11,
      fontWeight: '800',
    },

    // Dates Grid
    datesGrid: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
      borderRadius: 12,
      padding: 10,
      marginTop: 4,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#EDF2F7',
    },
    dateCol: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 3,
    },
    dateValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    dateDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 10,
    },

    // Notes Box
    notesBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    notesLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    notesText: {
      fontSize: 12,
      color: colors.textPrimary,
      lineHeight: 18,
    },

    // Card Actions
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    actionBtnSecondary: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    actionBtnSecondaryText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    actionBtnPrimary: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    actionBtnPrimaryText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionBtnDelete: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Bottom Navigation
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? colors.card : '#FFFFFF',
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 10,
      elevation: 12,
    },
    navItem: {
      alignItems: 'center',
      minWidth: 50,
    },
    navText: {
      fontSize: 10,
      color: colors.navInactive || '#64748B',
      marginTop: 4,
      fontWeight: '700',
    },
    navTextActive: {
      color: colors.primary,
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: 60,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E8F8EA',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 6,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyActionBtn: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    emptyActionBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDark ? colors.card : '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '90%',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 16,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    modalIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#E8F8EA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },

    fieldGroup: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    chipsScroll: {
      flexDirection: 'row',
      gap: 8,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipActive: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#E8F8EA',
      borderColor: colors.primary,
    },
    presetChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    textInput: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
      paddingHorizontal: 14,
      fontSize: 14,
      color: colors.textPrimary,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
    },

    dateInputRow: {
      flexDirection: 'row',
      gap: 10,
    },
    dateInputCol: {
      flex: 1,
    },

    submitModalBtn: {
      height: 50,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      marginBottom: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitModalBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
};

export default getStyles();
