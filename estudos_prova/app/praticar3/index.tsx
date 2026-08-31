import { View, Text, TextInput, TouchableOpacity } from 'react-native';
// 1. Complete a importação dos estilos
______ { styles } ____ '../../styles/praticar3_styles';
// 2. Complete a importação de um componente customizado
______ _____ ____ '../../components/BotaoCustomizado';

// DESAFIO 3: O grande teste final
// Preencha as lacunas com precisão absoluta.

______ _______ function Praticar3() {
  return (
    <____ style={styles.tela}>

      {/* 3. Um input que recebe senha (seguro) */}
      <_________
        style={styles.inputSenha}
        ___________="Digite sua senha"
        ____________________="black"
        ___________________={true} // propriedade para ocultar a senha digitada
      />

      {/* 4. Usando o componente externo que importamos no topo */}
      <_____
        label="Logar no Sistema"
        _______={() => alert('Logando...')}
      />

    </____>
  );
}
