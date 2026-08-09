import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
      padding: 20,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 5,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 22,
      color: '#FFFFFF',
      marginBottom: 30,
      textAlign: 'center',
    },
    label: {
      fontSize: 16,
      color: '#FF0000',
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    button1: {
      backgroundColor: '#FF0000',
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 8,
      flex: 1,
      marginRight: 10,
    },
    button2: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 8,
      flex: 1,
      marginLeft: 10,
      borderWidth: 2,
      borderColor: '#FF0000',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    buttonTextSecondary: {
      color: '#FF0000',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
