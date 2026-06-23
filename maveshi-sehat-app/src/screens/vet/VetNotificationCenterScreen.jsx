import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VetNotificationCenterScreen() {
  const navigation = useNavigation();
  
  
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Unread', 'Consultations', 'Alerts', 'Appointments'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    if (activeTab === 'Consultations') return n.type === 'consultation';
    if (activeTab === 'Alerts') return n.type === 'alert';
    if (activeTab === 'Appointments') return n.type === 'appointment';
    return true;
  });

  const renderNotificationCard = ({ item }) => {
    const isAlert = item.type === 'alert';
    const isConsultation = item.type === 'consultation';
    const isPrescription = item.type === 'prescription';
    const isAppointment = item.type === 'appointment';

    let iconName = 'bell';
    let iconColor = '#888';
    if (isAlert) { iconName = 'alert-triangle'; iconColor = '#FF3B30'; }
    else if (isConsultation) { iconName = 'message-square'; iconColor = '#58D66D'; }
    else if (isPrescription) { iconName = 'file-text'; iconColor = '#F5B041'; }
    else if (isAppointment) { iconName = 'calendar'; iconColor = '#3B82F6'; }

    return (
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        {!item.isRead && <View style={styles.unreadDot} />}
        
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name={iconName} size={18} color={iconColor} style={{ marginRight: 8 }} />
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
          </View>
          <TouchableOpacity>
            <Feather name="x" size={16} color="#CCC" />
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        <View style={styles.cardFooter}>
          <View style={[styles.typeBadge, { borderColor: iconColor }]}>
            <Text style={[styles.typeBadgeText, { color: iconColor }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.timeText}>{item.time}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={[styles.actionBtnText, { color: iconColor }]}>{item.actionText} →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Notification Center</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Feather name="settings" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>0</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#58D66D' }]}>0</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} {tab === 'Unread' && <View style={styles.unreadTabBadge} />}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {notifications.length} notifications
        </Text>
        <View style={styles.listHeaderActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Feather name="check" size={14} color="#58D66D" />
            <Text style={[styles.headerActionText, { color: '#58D66D' }]}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerActionBtn, { marginLeft: 16 }]}>
            <Feather name="trash-2" size={14} color="#FF3B30" />
            <Text style={[styles.headerActionText, { color: '#FF3B30' }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No notifications.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  settingsBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  tabsContainer: { backgroundColor: '#FFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  tabsScroll: { paddingHorizontal: 15 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F4F7F5', marginRight: 10 },
  tabBtnActive: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#58D66D' },
  tabText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#58D66D' },
  unreadTabBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', position: 'absolute', top: 0, right: -8 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  listHeaderText: { fontSize: 12, color: '#888' },
  listHeaderActions: { flexDirection: 'row' },
  headerActionBtn: { flexDirection: 'row', alignItems: 'center' },
  headerActionText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  notificationCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#58D66D' },
  unreadDot: { position: 'absolute', top: 16, left: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  unreadTitle: { fontWeight: '700' },
  notificationMessage: { fontSize: 14, color: '#555', lineHeight: 20 },
  notificationUrdu: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold' },
  footerRight: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#999', marginRight: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' }
});
