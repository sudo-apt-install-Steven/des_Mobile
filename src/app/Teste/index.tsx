import { Text, View } from 'react-native';
import { styles } from './_styles';

export default function Teste() {
  return (
    <View style={styles.container || { flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Página de Teste</Text>
    </View>
  );
}
