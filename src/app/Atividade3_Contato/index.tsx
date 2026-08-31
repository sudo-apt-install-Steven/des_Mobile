import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade3_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';
import EntradaTexto from '../../components/EntradaTexto';

export default function Atividade3_Contato() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividade 3</Text>
        <Text style={styles.subtitle}>Cadastro de Contato</Text>
        
        <Text style={styles.label}>Nome:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite o nome do contato"
          placeholderTextColor="#9CA3AF"
        />
        
        <Text style={styles.label}>Telefone:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite o telefone"
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.buttonContainer}>
          <Botao titulo="Salvar" corDeFundo="#059669" onPress={() => alert("Contato salvo!")} />
          <Botao titulo="Cancelar" corDeFundo="#DC2626" onPress={() => router.push('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
