import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C3D1E',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
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
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    elevation: 10,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  urduTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 22,
    textAlign: 'center',
  },
  englishSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    textAlign: 'center',
  },
  urduSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  /* ── Bottom section ── */
  bottomSection: {
    paddingBottom: 36,
  },
  loginBtn: {
    backgroundColor: '#84f285',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#072B14',
  },
  registerBtn: {
    backgroundColor: '#fbed76',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  registerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  trustText: {
    textAlign: 'center',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.42)',
  },

  /* ── Language Selection Modal ── */
  langBadgeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 44,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  langOptionCardSelected: {
    borderColor: '#58D66D',
    backgroundColor: '#F0FDF4',
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
    fontWeight: '600',
    color: '#1E293B',
  },
  langCardTitleSelected: {
    fontWeight: '700',
    color: '#166534',
  },
  langCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default styles;
