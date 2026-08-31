import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../styles/praticar_styles';

// Complete o código abaixo para que ele funcione corretamente.
// Dica: Preste atenção no nome dos componentes, propriedades (props) e camelCase
// Lembre-se que cada espaço, vírgula e letra maiúscula/minúscula importa.

export default function Praticar() {
  return (
    <View _______={styles.container}>
      {/* 1. Adicione o componente de imagem com a fonte local (substitua o require pelo caminho correto) e o estilo */}
      <_____ source={_______('../../../assets/icon.png')} style={styles._____} />

      {/* 2. Adicione o componente de texto e o texto "Bem-vindo à Prova" */}
      <____ style={styles.title}>Bem-vindo à Prova</____>

      {/* 3. Adicione o componente de input de texto, com placeholder e placeholderTextColor */}
      <_________
        style={styles.input}
        ___________="Digite seu nome"
        ____________________="#999"
      />

      {/* 4. Adicione o componente de botão tocável que reage ao toque alterando a opacidade */}
      <________________
        style={styles.button}
        _______={() => console.log('Botão pressionado!')}
      >
        <Text style={styles.buttonText}>Confirmar</Text>
      </________________>
    </View>
  );
}
