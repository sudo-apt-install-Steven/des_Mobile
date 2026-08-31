import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  counterContainer: {
    backgroundColor: '#374151',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  counterText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  btnWrapper: {
    flex: 1,
  },
  fullWidthBtn: {
    width: '100%',
  }
});
