import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  vetName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  typeText: { fontSize: 14, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  reasonText: { fontSize: 14, color: '#444', marginBottom: 8 },
  dateText: { fontSize: 14, color: '#D98A22', fontWeight: 'bold', marginBottom: 12 },
  chatBtn: { backgroundColor: '#58D66D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 8 },
  chatBtnText: { color: '#FFF', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#888' }
});

export default styles;
