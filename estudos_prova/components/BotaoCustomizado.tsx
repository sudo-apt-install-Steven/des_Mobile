import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { StyleSheet } from 'react-native';

// 1. Tipagem usando a extensão das propriedades normais de um TouchableOpacity
type BotaoCustomizadoProps = _____________________ & {
  label: ______;
}

// 2. Usando o Rest Operator para passar as props nativas
export default function BotaoCustomizado({ label, ...____ }: BotaoCustomizadoProps) {
  return (
    // 3. Aplicando as propriedades restantes no TouchableOpacity
    <________________ style={styles.botao} {_______}>
      <____ style={styles.textoBotao}>{label}</____>
    </________________>
  )
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  textoBotao: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});
