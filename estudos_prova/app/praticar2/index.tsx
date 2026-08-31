import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/praticar2_styles';

// DESAFIO 2: Componentização e Eventos
// Preencha as lacunas corretamente

// 1. Crie um tipo para as props de um componente customizado
____ TituloProps = {
  texto: ______;
}

// 2. Crie o componente funcional usando as props
________ ________ function TituloCustomizado({ texto }: TituloProps) {
  return <____ style={styles.tituloSecundario}>{texto}</____>;
}

export default function Praticar2() {
  return (
    <View style={styles._________}>

      {/* 3. Utilize o componente criado acima passando a prop necessária */}
      <_________________ _____="Meu Componente Customizado" />

      {/* 4. Complete o Pressable com o evento disparado no momento EXATO do toque (antes de soltar) */}
      <_________
        style={styles.botaoModerno}
        _________={() => console.log('Dedo encostou na tela!')}
        __________={() => console.log('Dedo saiu da tela!')}
      >
        <Text style={styles.textoBranco}>Toque longo aqui</Text>
      </_________>

    </View>
  );
}
