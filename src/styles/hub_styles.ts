import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark mode based on images
  },
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  }
});
