import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, TouchableOpacity, FlatList, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { styles } from '../../styles/atividade9_flatlist_styles';

interface Tarefa {
  id: string;
  texto: string;
}

export default function Atividade9FlatList() {
  // Estado do input de texto
  const [tarefa, setTarefa] = useState('');

  // Estado com a lista de tarefas inicial do exemplo
  const [tarefas, setTarefas] = useState<Tarefa[]>([
    { id: '1', texto: 'Estudar React Native' },
    { id: '2', texto: 'Fazer exercícios' },
    { id: '3', texto: 'Ler um livro' },
    { id: '4', texto: 'Organizar o quarto' },
    { id: '5', texto: 'Aprender Node.js' },
  ]);

  // Função para adicionar uma nova tarefa
  const adicionarTarefa = () => {
    if (!tarefa.trim()) {
      Alert.alert('Aviso', 'Por favor, digite o nome da tarefa.');
      return;
    }

    const novaTarefa: Tarefa = {
      id: Date.now().toString(),
      texto: tarefa.trim(),
    };

    setTarefas(prev => [...prev, novaTarefa]);
    setTarefa('');
    Keyboard.dismiss();
  };

  // Função para remover uma tarefa da lista
  const removerTarefa = (id: string) => {
    setTarefas(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#007AFF" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Tarefas</Text>
      </View>

      <View style={styles.content}>
        {/* Campo de texto para digitar a tarefa */}
        <TextInput
          style={styles.input}
          placeholder="Digite uma nova tarefa..."
          placeholderTextColor="#9CA3AF"
          value={tarefa}
          onChangeText={setTarefa}
        />

        {/* Botão Adicionar */}
        <TouchableOpacity style={styles.addBtn} onPress={adicionarTarefa}>
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>

        {/* Lista usando FlatList (renderiza apenas itens visíveis/viewport) */}
        <FlatList
          data={tarefas}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.tarefaCard}>
              <Text style={styles.tarefaTexto}>{item.texto}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removerTarefa(item.id)}
              >
                <Feather name="trash-2" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma tarefa cadastrada!</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.hubBtnContainer}>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#64748B' }]}
                onPress={() => router.push('/')}
              >
                <Text style={styles.addBtnText}>Voltar para o Hub</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
