import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    borderRadius: 16, 
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  whiteBg: {
    backgroundColor: '#FFFFFF',
  },
  yellowBg: {
    backgroundColor: '#FFE135', 
  },
  whiteText: {
    color: '#4CB85C', 
    fontSize: 16,
    fontWeight: '700',
  },
  yellowText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default styles;
