import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade5_styles';
import { router } from 'expo-router';
import Botao from '../../components/Botao';
import EntradaTexto from '../../components/EntradaTexto';

export default function Atividade5() {
  const [nome, setNome] = useState('');
  const [nomeSalvo, setNomeSalvo] = useState('');

  const handleSalvar = () => {
    setNomeSalvo(nome);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Cadastro de Usuário</Text>
        
        <Text style={styles.label}>Nome:</Text>
        <EntradaTexto 
          style={styles.input} 
          placeholder="Digite seu nome"
          placeholderTextColor="#9CA3AF"
          value={nome}
          onChangeText={setNome}
        />
        
        <Botao titulo="Salvar" corDeFundo="#059669" onPress={handleSalvar} />
        
        {nomeSalvo !== '' && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>Olá, {nomeSalvo}! Seja bem-vindo!</Text>
          </View>
        )}

        <View style={styles.btnSpace}>
            <Botao titulo="Voltar" corDeFundo="#4B5563" onPress={() => router.push('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
