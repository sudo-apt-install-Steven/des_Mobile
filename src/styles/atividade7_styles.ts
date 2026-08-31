import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  calcBtn: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  calcBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBoxOrange: {
    backgroundColor: '#452300',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultBoxGreen: {
    backgroundColor: '#064E3B',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabelOrange: {
    color: '#F59E0B',
    fontSize: 16,
  },
  resultValueOrange: {
    color: '#F59E0B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultLabelGreen: {
    color: '#34D399',
    fontSize: 16,
  },
  resultValueGreen: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 16,
    fontWeight: 'normal',
  }
});
