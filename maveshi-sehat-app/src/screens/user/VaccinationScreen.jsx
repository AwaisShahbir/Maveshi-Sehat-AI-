import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t, subscribeTranslation } from '../../utils/translate';
import { useTheme } from '../../utils/themeContext';
import { getStyles } from '../../styles/VaccinationScreenStyles';
import { getProfile } from '../../utils/profileStore';

const VACCINE_PRESETS = [
  { name: 'Foot & Mouth Disease (FMD)', urdu: 'منہ کھر' },
  { name: 'Hemorrhagic Septicemia (HS)', urdu: 'گل گھوٹو' },
  { name: 'Black Quarter (BQ)', urdu: 'چوڑیا' },
  { name: 'Anthrax Vaccine', urdu: 'تیلی' },
  { name: 'Lumpy Skin Disease (LSD)', urdu: 'لمپی سکن' },
  { name: 'Enterotoxemia (ETV)', urdu: 'انتڑیو کا زہر' },
];

const ANIMAL_TYPES = ['Cattle', 'Cow', 'Buffalo', 'Goat', 'Sheep'];

export default function VaccinationScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();

  const profile = getProfile();
  const userName = profile.userName || params.userName || '';
  const userId = params.userId || profile.userId || null;

  const [activeTab, setActiveTab] = useState('Upcoming'); // 'Upcoming' | 'Completed'
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Add Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customVaccineName, setCustomVaccineName] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('Cattle');
  const [administeredDate, setAdministeredDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

  // Listen for language changes
  useEffect(() => {
    const unsub = subscribeTranslation(() => setTick((prev) => prev + 1));
    return unsub;
  }, []);

  const fetchVaccinations = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/farmer/vaccinations?farmerName=${encodeURIComponent(userName)}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setVaccinations(data);
      }
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl, userName]);

  useEffect(() => {
    fetchVaccinations();
  }, [fetchVaccinations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVaccinations();
  };

  // Open modal with fresh defaults
  const handleOpenAddModal = (presetName = '') => {
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const defaultNext = sixMonthsLater.toISOString().split('T')[0];

    setSelectedPreset(presetName);
    setCustomVaccineName(presetName);
    setSelectedAnimal('Cattle');
    setAdministeredDate(today);
    setNextDueDate(defaultNext);
    setNotes('');
    setAddModalVisible(true);
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.name);
    setCustomVaccineName(preset.name);
  };

  const setDueInterval = (months) => {
    const base = administeredDate ? new Date(administeredDate) : new Date();
    if (isNaN(base.getTime())) return;
    base.setMonth(base.getMonth() + months);
    setNextDueDate(base.toISOString().split('T')[0]);
  };

  const handleSaveVaccination = async () => {
    const finalName = customVaccineName.trim() || selectedPreset;
    if (!finalName) {
      Alert.alert(t('Error'), t('Please enter vaccine name'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/farmer/vaccinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerName: userName,
          farmerId: userId,
          vaccineName: finalName,
          animalType: selectedAnimal,
          administeredDate: administeredDate || new Date().toISOString().split('T')[0],
          nextDueDate: nextDueDate || null,
          status: activeTab === 'Completed' ? 'Completed' : 'Upcoming',
          notes: notes.trim(),
        }),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        Alert.alert(t('Success'), t('Vaccination schedule saved successfully!'));
        setAddModalVisible(false);
        fetchVaccinations();
      } else {
        Alert.alert(t('Error'), resJson.error || 'Failed to save vaccination');
      }
    } catch (err) {
      Alert.alert(t('Error'), 'Network error saving vaccination.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (item) => {
    if (item.source === 'self') {
      try {
        const response = await fetch(`${baseUrl}/api/farmer/vaccinations/${item.id}/complete`, {
          method: 'PUT',
        });
        if (response.ok) {
          Alert.alert(t('Success'), t('Vaccination marked completed!'));
          fetchVaccinations();
        }
      } catch (err) {
        Alert.alert(t('Error'), 'Could not update status.');
      }
    } else {
      // Vet message vaccination - mark locally completed
      setVaccinations((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, status: 'Completed', vaccination_data: { ...v.vaccination_data, status: 'Completed' } } : v))
      );
      Alert.alert(t('Success'), t('Vaccination marked completed!'));
    }
  };

  const handleDeleteVaccination = (item) => {
    Alert.alert(
      t('Delete Vaccination'),
      t('Are you sure you want to delete this vaccination record?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${baseUrl}/api/farmer/vaccinations/${item.id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                fetchVaccinations();
              }
            } catch (err) {
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  // Format vaccine display name
  const formatVaccineName = (name) => {
    if (!name) return 'Livestock Vaccine';
    const lower = name.toLowerCase().trim();
    if (lower === 'fmd' || lower.includes('foot and mouth')) return 'Foot & Mouth Disease (FMD / منہ کھر)';
    if (lower === 'hs' || lower.includes('hemorrhagic') || lower.includes('septicemia')) return 'Hemorrhagic Septicemia (HS / گل گھوٹو)';
    if (lower === 'bq' || lower.includes('black quarter') || lower.includes('blackleg')) return 'Black Quarter (BQ / چوڑیا)';
    if (lower === 'anthrax') return 'Anthrax Vaccine (تیلی)';
    if (lower === 'lsd' || lower.includes('lumpy')) return 'Lumpy Skin Disease (LSD)';
    if (lower === 'etv' || lower.includes('enterotoxemia')) return 'Enterotoxemia (انتڑیو کا زہر)';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Determine urgency badge
  const getUrgency = (nextDueDateStr, status) => {
    if (status === 'Completed') {
      return { label: t('Completed'), type: 'completed' };
    }
    if (!nextDueDateStr) {
      return { label: t('Upcoming'), type: 'upcoming' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `${t('Overdue')} (${Math.abs(diffDays)}d)`, type: 'overdue' };
    }
    if (diffDays === 0) {
      return { label: t('Due Today'), type: 'upcoming' };
    }
    if (diffDays === 1) {
      return { label: t('Due Tomorrow'), type: 'upcoming' };
    }
    return { label: `${t('Due in')} ${diffDays}d`, type: 'upcoming' };
  };

  // Separate lists for Upcoming vs Completed
  const { upcomingList, completedList } = useMemo(() => {
    const upcoming = [];
    const completed = [];

    vaccinations.forEach((item) => {
      let data = item.vaccination_data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }
      if (!data) data = {};

      const status = item.status || data.status;
      const nextDue = item.next_due_date || data.nextDueDate;

      if (status === 'Completed') {
        completed.push(item);
      } else if (nextDue && new Date(nextDue) < new Date() && status !== 'Completed') {
        // Overdue vaccine still belongs to Upcoming tab because action is required!
        upcoming.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return { upcomingList: upcoming, completedList: completed };
  }, [vaccinations]);

  const activeVaccines = activeTab === 'Upcoming' ? upcomingList : completedList;

  const renderVaccineItem = ({ item }) => {
    let data = item.vaccination_data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    if (!data) data = {};

    const rawName = item.vaccine_name || data.vaccineName || 'Vaccine';
    const displayName = formatVaccineName(rawName);
    const animal = item.animal_type || data.animalType || 'Livestock';
    const admDate = item.vaccine_date || data.vaccineDate || 'N/A';
    const nextDate = item.next_due_date || data.nextDueDate || 'N/A';
    const vet = item.vet_name || data.vetName || (item.source === 'vet' ? 'Veterinarian' : 'Self-Administered');
    const itemNotes = item.notes || data.notes || '';
    const itemStatus = item.status || data.status;
    const urgency = getUrgency(nextDate !== 'N/A' ? nextDate : null, itemStatus);

    return (
      <View style={styles.card}>
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.iconContainer,
                urgency.type === 'completed'
                  ? styles.iconCompleted
                  : urgency.type === 'overdue'
                  ? styles.iconOverdue
                  : styles.iconUpcoming,
              ]}
            >
              {urgency.type === 'completed' ? (
                <Feather name="check-circle" size={22} color="#10B981" />
              ) : urgency.type === 'overdue' ? (
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
              ) : (
                <MaterialCommunityIcons name="needle" size={22} color="#F59E0B" />
              )}
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.vaccineTitle} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.tagsRow}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>🐄 {t(animal)}</Text>
                </View>
                <View style={[styles.tagPill, styles.vetTagPill]}>
                  <Text style={[styles.tagText, styles.vetTagText]} numberOfLines={1}>
                    {vet.startsWith('Dr.') ? '🩺' : '👤'} {vet}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              urgency.type === 'completed'
                ? styles.statusCompleted
                : urgency.type === 'overdue'
                ? styles.statusOverdue
                : styles.statusUpcoming,
            ]}
          >
            <Text
              style={[
                urgency.type === 'completed'
                  ? styles.statusTextCompleted
                  : urgency.type === 'overdue'
                  ? styles.statusTextOverdue
                  : styles.statusTextUpcoming,
              ]}
            >
              {urgency.label}
            </Text>
          </View>
        </View>

        {/* Dates Grid */}
        <View style={styles.datesGrid}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>{t('Administered')}</Text>
            <View style={styles.dateValueRow}>
              <Feather name="calendar" size={13} color={colors.textSecondary} />
              <Text style={styles.dateValue}>{admDate}</Text>
            </View>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>{t('Next Due Date')}</Text>
            <View style={styles.dateValueRow}>
              <Feather
                name="clock"
                size={13}
                color={urgency.type === 'overdue' ? '#EF4444' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.dateValue,
                  urgency.type === 'overdue' && { color: '#EF4444', fontWeight: '800' },
                ]}
              >
                {nextDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes callout if present */}
        {!!itemNotes && itemNotes.trim() !== 'no' && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t('Notes')}:</Text>
            <Text style={styles.notesText}>{itemNotes}</Text>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.cardActionsRow}>
          {activeTab === 'Upcoming' ? (
            <>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => handleMarkComplete(item)}
                activeOpacity={0.8}
              >
                <Feather name="check" size={15} color={colors.primary} />
                <Text style={styles.actionBtnSecondaryText}>{t('Mark Done')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => navigation.navigate('Marketplace', { search: rawName })}
                activeOpacity={0.8}
              >
                <Feather name="shopping-bag" size={15} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>{t('Order Vaccine')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => handleOpenAddModal(rawName)}
                activeOpacity={0.8}
              >
                <Feather name="rotate-cw" size={14} color={colors.primary} />
                <Text style={styles.actionBtnSecondaryText}>{t('Schedule Next Booster')}</Text>
              </TouchableOpacity>

              {item.source === 'self' && (
                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDeleteVaccination(item)}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={15} color="#EF4444" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDark ? colors.headerBackground : colors.primary}
      />

      <View style={styles.mainContainer}>
        {/* Modern Header Container */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>{t('Vaccination')}</Text>
                <Text style={styles.headerSubtitle}>{t('Vaccination Schedule')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleOpenAddModal()}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color={colors.primary} />
              <Text style={styles.addButtonText}>{t('Add')}</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Filter Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]}
              onPress={() => setActiveTab('Upcoming')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>
                {t('Upcoming')}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'Upcoming' && styles.activeTabBadge,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'Upcoming' && styles.activeTabBadgeText,
                  ]}
                >
                  {upcomingList.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
              onPress={() => setActiveTab('Completed')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
                {t('Completed')}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'Completed' && styles.activeTabBadge,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'Completed' && styles.activeTabBadgeText,
                  ]}
                >
                  {completedList.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={activeVaccines}
            renderItem={renderVaccineItem}
            keyExtractor={(item, index) => `${item.id || index}-${item.source || 'v'}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            ListHeaderComponent={
              <View style={styles.guideBanner}>
                <TouchableOpacity
                  style={styles.guideHeader}
                  onPress={() => setGuideExpanded(!guideExpanded)}
                  activeOpacity={0.8}
                >
                  <View style={styles.guideTitleRow}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={20}
                      color={isDark ? '#93C5FD' : '#1D4ED8'}
                    />
                    <Text style={styles.guideTitle}>{t('Seasonal Vaccination Guide (حکومتی شیڈول)')}</Text>
                  </View>
                  <Feather
                    name={guideExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isDark ? '#93C5FD' : '#1D4ED8'}
                  />
                </TouchableOpacity>

                {guideExpanded && (
                  <View style={styles.guideBody}>
                    <View style={styles.guideItemRow}>
                      <Text style={styles.guideItemPeriod}>Feb – Mar:</Text>
                      <Text style={styles.guideItemText}>FMD (1st Dose) & HS Pre-Monsoon</Text>
                    </View>
                    <View style={styles.guideItemRow}>
                      <Text style={styles.guideItemPeriod}>May – Jun:</Text>
                      <Text style={styles.guideItemText}>Black Quarter (BQ) & Anthrax</Text>
                    </View>
                    <View style={styles.guideItemRow}>
                      <Text style={styles.guideItemPeriod}>Sep – Oct:</Text>
                      <Text style={styles.guideItemText}>FMD (2nd Booster) & HS Post-Monsoon</Text>
                    </View>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="needle" size={38} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'Upcoming' ? t('No upcoming vaccinations') : t('No completed vaccinations')}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'Upcoming'
                    ? t('Stay ahead of disease outbreaks by logging your herd vaccination schedule.')
                    : t('Completed vaccinations will appear here after being administered.')}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => handleOpenAddModal()}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={18} color="#FFF" />
                  <Text style={styles.emptyActionBtnText}>{t('Add Vaccination')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
            <Feather name="home" size={24} color={colors.navInactive || '#64748B'} />
            <Text style={styles.navText}>{t('Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('AiScan', { userName, userId })}
          >
            <MaterialCommunityIcons name="line-scan" size={24} color={colors.navInactive || '#64748B'} />
            <Text style={styles.navText}>{t('AI Scan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('HealthRecords', { userName, userId })}
          >
            <Feather name="file-text" size={24} color={colors.navInactive || '#64748B'} />
            <Text style={styles.navText}>{t('Records')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('CommunityForum', { userName, userId })}
          >
            <Feather name="message-square" size={24} color={colors.navInactive || '#64748B'} />
            <Text style={styles.navText}>{t('Forum')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile', { userId })}>
            <Feather name="user" size={24} color={colors.navInactive || '#64748B'} />
            <Text style={styles.navText}>{t('Profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add / Schedule Vaccination Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconCircle}>
                  <MaterialCommunityIcons name="needle" size={20} color={colors.primary} />
                </View>
                <Text style={styles.modalTitle}>{t('Add Vaccination')}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Vaccine Selection Presets */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('Quick Select Vaccine')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {VACCINE_PRESETS.map((p) => {
                    const isSelected = selectedPreset === p.name;
                    return (
                      <TouchableOpacity
                        key={p.name}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => handleSelectPreset(p)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {p.name} ({p.urdu})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Vaccine Name Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('Vaccine Name')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Foot and Mouth Disease (FMD)"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={customVaccineName}
                  onChangeText={setCustomVaccineName}
                />
              </View>

              {/* Target Animal Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('Target Animal')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {ANIMAL_TYPES.map((a) => {
                    const isSelected = selectedAnimal === a;
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setSelectedAnimal(a)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {t(a)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Date Administered & Next Due Date */}
              <View style={styles.dateInputRow}>
                <View style={[styles.fieldGroup, styles.dateInputCol]}>
                  <Text style={styles.fieldLabel}>{t('Date Administered')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={administeredDate}
                    onChangeText={setAdministeredDate}
                  />
                </View>

                <View style={[styles.fieldGroup, styles.dateInputCol]}>
                  <Text style={styles.fieldLabel}>{t('Next Due Date')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={nextDueDate}
                    onChangeText={setNextDueDate}
                  />
                </View>
              </View>

              {/* Quick Due Date Interval Helpers */}
              <View style={[styles.fieldGroup, { marginTop: -4 }]}>
                <Text style={[styles.fieldLabel, { fontSize: 11, color: colors.textSecondary }]}>
                  {t('Quick Due Date')}:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.presetChip, { paddingVertical: 4, paddingHorizontal: 10 }]}
                    onPress={() => setDueInterval(3)}
                  >
                    <Text style={[styles.presetChipText, { fontSize: 11 }]}>+3 {t('Months')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetChip, { paddingVertical: 4, paddingHorizontal: 10 }]}
                    onPress={() => setDueInterval(6)}
                  >
                    <Text style={[styles.presetChipText, { fontSize: 11 }]}>+6 {t('Months')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetChip, { paddingVertical: 4, paddingHorizontal: 10 }]}
                    onPress={() => setDueInterval(12)}
                  >
                    <Text style={[styles.presetChipText, { fontSize: 11 }]}>+1 {t('Year')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('Notes')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="e.g. Dose: 5ml subcutaneous, monitor herd after 24 hrs..."
                  placeholderTextColor={colors.inputPlaceholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSaveVaccination}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFF" />
                    <Text style={styles.submitModalBtnText}>{t('Save Vaccination')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
