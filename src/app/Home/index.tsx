import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, SafeAreaViewBase } from 'react-native';
import { styles } from './styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';
import EntradaTexto from '../../components/EntradaTexto';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Atividade 02</Text>
        <Text style={styles.subtitle}>Tela de Login</Text>
        
        <Text style={styles.label}>Nome:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite seu nome"
          placeholderTextColor="#999"
        />
        
        <Text style={styles.label}>Email:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite seu email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        
        <Text style={styles.label}>Senha:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite sua senha"
          secureTextEntry
          placeholderTextColor="#999"
        />

        <Botao titulo="Página Teste" onPress={() => router.push('/Teste')}></Botao>
        <Botao titulo="Página 01" onPress={() => router.push('/Cadastro')}></Botao>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button1}
            onPress={() => alert("Login efetuado com sucesso!")}
          >
            <Text style={styles.buttonText}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button2}
            onPress={() => router.push('/Cadastro')}
          >
            <Text style={styles.buttonTextSecondary}>Cadastrar</Text>
            
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
