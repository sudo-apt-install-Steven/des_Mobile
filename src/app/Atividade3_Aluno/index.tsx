import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade3_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';
import EntradaTexto from '../../components/EntradaTexto';

export default function Atividade3_Aluno() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividade 3</Text>
        <Text style={styles.subtitle}>Cadastro de Aluno</Text>
        
        <Text style={styles.label}>Nome Completo:</Text>
        <EntradaTexto style={styles.input} placeholder="Digite o nome completo" placeholderTextColor="#9CA3AF" />
        
        <Text style={styles.label}>E-mail:</Text>
        <EntradaTexto style={styles.input} placeholder="Digite o e-mail" keyboardType="email-address" placeholderTextColor="#9CA3AF" />
        
        <Text style={styles.label}>Telefone:</Text>
        <EntradaTexto style={styles.input} placeholder="Digite o telefone" keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Data de Nascimento:</Text>
        <EntradaTexto style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Endereço:</Text>
        <EntradaTexto style={styles.input} placeholder="Digite o endereço completo" placeholderTextColor="#9CA3AF" />

        <Text style={styles.label}>Curso:</Text>
        <EntradaTexto style={styles.input} placeholder="Digite o curso" placeholderTextColor="#9CA3AF" />
        
        <View style={styles.buttonContainer}>
          <Botao titulo="Salvar" corDeFundo="#059669" onPress={() => alert("Aluno salvo!")} />
          <Botao titulo="Limpar" corDeFundo="#D97706" onPress={() => alert("Campos limpos!")} />
          <Botao titulo="Cancelar" corDeFundo="#DC2626" onPress={() => router.push('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
