import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/atividade8_styles';
import { router } from 'expo-router';

interface Contato {
  id: string;
  nome: string;
  telefone: string;
}

export default function Atividade8() {
  // Estados para capturar os dados digitados
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  // Estado com a lista de contatos (inicia com exemplos para demonstrar o .map())
  const [contatos, setContatos] = useState<Contato[]>([
    { id: '1', nome: 'Carlos Silva', telefone: '(11) 98765-4321' },
    { id: '2', nome: 'Mariana Souza', telefone: '(21) 99876-5432' },
  ]);

  // Função para cadastrar novo contato
  const adicionarContato = () => {
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome e o telefone.');
      return;
    }

    const novoContato: Contato = {
      id: Date.now().toString(),
      nome: nome.trim(),
      telefone: telefone.trim(),
    };

    // Adiciona o novo contato ao array
    setContatos(prev => [...prev, novoContato]);

    // Limpa os campos
    setNome('');
    setTelefone('');
    Keyboard.dismiss();
  };

  // Função para remover um contato pelo id
  const removerContato = (id: string) => {
    setContatos(prev => prev.filter(contato => contato.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Atividade 8</Text>
          <Text style={styles.subtitle}>Cadastro de Contatos com .map()</Text>
        </View>

        {/* Card do Formulário de Cadastro */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Novo Contato</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome completo"
            placeholderTextColor="#6B7280"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: (11) 99999-9999"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />

          <TouchableOpacity style={styles.addBtn} onPress={adicionarContato}>
            <Text style={styles.addBtnText}>Cadastrar Contato</Text>
          </TouchableOpacity>
        </View>

        {/* Card da Lista: Demonstração clara do uso do .map() para renderizar todos os elementos */}
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>
            Contatos Cadastrados ({contatos.length})
          </Text>

          {contatos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum contato cadastrado ainda.</Text>
          ) : (
            // Uso do .map() para percorrer o array e retornar o JSX de cada contato
            contatos.map((contato) => (
              <View key={contato.id} style={styles.contatoItem}>
                <View style={styles.contatoInfo}>
                  <Text style={styles.contatoNome}>{contato.nome}</Text>
                  <Text style={styles.contatoTelefone}>{contato.telefone}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removerContato(contato.id)}
                >
                  <Text style={styles.deleteBtnText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Botão de navegação de volta para o Hub */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: '#4B5563', marginTop: 10 }]}
          onPress={() => router.push('/')}
        >
          <Text style={styles.addBtnText}>Voltar para o Hub</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
