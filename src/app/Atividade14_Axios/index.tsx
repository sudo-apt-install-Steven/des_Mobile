import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://apivacinacao.dev.vilhena.ifro.edu.br/proprietarios';

type Proprietario = {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
};

export default function ProprietariosScreen() {
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');

  async function buscarProprietarios() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await axios.get(API_URL);
      const dados = resposta.data;
      console.log(dados);
      const lista = Array.isArray(dados) ? dados : dados.value;
      setProprietarios(lista ?? []);
    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarProprietarios();
  }, []);

  const renderItem = ({ item }: { item: Proprietario }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.nome}</Text>
      <Text style={styles.info}>CPF: {item.cpf}</Text>
      <Text style={styles.info}>Telefone: {item.telefone}</Text>
      <Text style={styles.info}>Email: {item.email}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Proprietários</Text>
        <TouchableOpacity onPress={buscarProprietarios} style={styles.refreshBtn} accessible accessibilityLabel="Atualizar lista">
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
      {carregando && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d7c3d" />
        </View>
      )}
      {erro !== '' && (
        <View style={styles.center}>
          <Text style={styles.error}>{erro}</Text>
          <TouchableOpacity onPress={buscarProprietarios} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      {!carregando && erro === '' && (
        <FlatList
          data={proprietarios}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={styles.empty}>Nenhum proprietário encontrado.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#0d7c3d',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshBtn: {
    padding: 4,
  },
  refreshIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  error: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#0d7c3d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
  },
  info: {
    fontSize: 14,
    color: '#374151',
  },
  empty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
