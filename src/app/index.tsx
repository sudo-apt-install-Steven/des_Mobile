import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../styles/hub_styles';
import Botao from '../components/Botao';

export default function Hub() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Hub de Atividades</Text>
          <Text style={styles.subtitle}>Selecione uma atividade para visualizar</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Botao titulo="Atividade 1 (Foto e Botões)" onPress={() => router.push('/Atividade1')} />
          <Botao titulo="Atividade 2 (Tela de Login)" onPress={() => router.push('/Atividade2')} />
          <Botao titulo="Atividade 3 (Cadastro Contato)" onPress={() => router.push('/Atividade3_Contato')} />
          <Botao titulo="Atividade 3 (Cadastro Aluno)" onPress={() => router.push('/Atividade3_Aluno')} />
          <Botao titulo="Atividade 4 (Contador useState)" onPress={() => router.push('/Atividade4')} />
          <Botao titulo="Atividade 5 (Cadastro Usuário)" onPress={() => router.push('/Atividade5')} />
          <Botao titulo="Atividade 6 (Cálculo Ração)" onPress={() => router.push('/Atividade6')} />
          <Botao titulo="Atividade 7 (Seguro Veicular)" onPress={() => router.push('/Atividade7')} />
          <Botao titulo="Atividade 8 (Cadastro com Map)" onPress={() => router.push('/Atividade8_map')} />
          <Botao titulo="Atividade 9 (Tarefas - FlatList)" onPress={() => router.push('/Atividade9_FlatList')} />
          <Botao titulo="Atividade 9 (Produtos - Map)" onPress={() => router.push('/Atividade9_map')} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
