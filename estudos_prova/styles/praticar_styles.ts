import { StyleSheet } from 'react-native';

// Complete a exportação e os nomes das propriedades
______ const styles = StyleSheet.______(___
  container: {
    flex: 1,
    __________: 'center', // Alinhamento dos itens no eixo secundário (horizontal)
    ______________: 'center', // Alinhamento do conteúdo no eixo principal (vertical)
    _______________: '#f5f5f5', // Cor de fundo
    padding: 20,
  },
  logo: {
    _____: 100, // Largura
    ______: 100, // Altura
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    _____: '#333', // Cor do texto
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    ____________: 8, // Arredondamento da borda
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    ____________: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
___);
