import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  header: { backgroundColor: '#58D66D', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  titleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  newBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  newBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFF' },
  tabBtnInactive: { backgroundColor: 'transparent' },
  tabText: { fontWeight: 'bold', fontSize: 14 },
  tabTextActive: { color: '#58D66D' },
  tabTextInactive: { color: '#FFF' },

  
  historyContainer: { flex: 1 },
  searchContainer: { margin: 16, backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, height: 48, justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  searchInput: { fontSize: 15, color: '#333' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyFarmerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historyDate: { fontSize: 12, color: '#888' },
  historyDiagnosis: { fontSize: 14, color: '#58D66D', fontWeight: 'bold', marginBottom: 8 },
  historyDivider: { height: 1, backgroundColor: '#EAEAEA', marginBottom: 12 },
  historyMedicineText: { fontSize: 14, color: '#555', marginBottom: 4 },

  
  writeNewContainer: { padding: 16, paddingBottom: 100 },
  formSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitleText: { fontSize: 13, color: '#888', fontWeight: 'bold', marginLeft: 8, letterSpacing: 0.5 },
  inputLabel: { fontSize: 12, color: '#555', marginBottom: 6, fontWeight: '600' },
  inputField: { borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#333', marginBottom: 16, backgroundColor: '#F9F9F9' },
  addMedicineBtn: { color: '#58D66D', fontWeight: 'bold', fontSize: 14 },
  medicineCard: { backgroundColor: '#F8FAF9', borderRadius: 12, padding: 12, marginBottom: 12 },
  medicineIndex: { fontSize: 12, color: '#58D66D', fontWeight: 'bold', marginBottom: 8 },
  medicineDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginHorizontal: 4, paddingHorizontal: 10 },
  textArea: { borderRadius: 16, height: 100, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#58D66D', borderRadius: 25, paddingVertical: 16, alignItems: 'center', elevation: 3, shadowColor: '#58D66D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default styles;
