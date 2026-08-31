import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade2_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';
import EntradaTexto from '../../components/EntradaTexto';

export default function Atividade2() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividade 02</Text>
        <Text style={styles.subtitle}>Tela de Login</Text>
        
        <Text style={styles.label}>Nome:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite seu nome"
          placeholderTextColor="#9CA3AF"
        />
        
        <Text style={styles.label}>Email:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite seu email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
        
        <Text style={styles.label}>Senha:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite sua senha"
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.buttonContainer}>
          <Botao titulo="Entrar" onPress={() => alert("Login efetuado com sucesso!")} />
          <Botao titulo="Voltar para Hub" corDeFundo="#4B5563" onPress={() => router.push('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
