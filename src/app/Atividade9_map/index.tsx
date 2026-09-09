import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { styles } from '../../styles/atividade9_map_styles';

interface Produto {
  id: string;
  nome: string;
  preco: string;
  quantidade: string;
  tipo?: 'notebook' | 'mouse' | 'teclado' | 'monitor' | 'outro';
}

export default function Atividade9Map() {
  // Estados para os inputs
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');

  // Estado com a lista de produtos (inicia com os produtos do modelo)
  const [produtos, setProdutos] = useState<Produto[]>([
    { id: '1', nome: 'Notebook', preco: 'R$ 3.500,00', quantidade: '5', tipo: 'notebook' },
    { id: '2', nome: 'Mouse', preco: 'R$ 80,00', quantidade: '15', tipo: 'mouse' },
    { id: '3', nome: 'Teclado', preco: 'R$ 150,00', quantidade: '8', tipo: 'teclado' },
    { id: '4', nome: 'Monitor', preco: 'R$ 1.200,00', quantidade: '3', tipo: 'monitor' },
  ]);

  // Função para adicionar produto à lista
  const adicionarProduto = () => {
    if (!nome.trim() || !preco.trim() || !quantidade.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos do produto.');
      return;
    }

    // Identifica o tipo para escolher o ícone
    const nomeMinusculo = nome.toLowerCase();
    let tipo: Produto['tipo'] = 'outro';
    if (nomeMinusculo.includes('notebook') || nomeMinusculo.includes('laptop')) tipo = 'notebook';
    else if (nomeMinusculo.includes('mouse')) tipo = 'mouse';
    else if (nomeMinusculo.includes('teclado')) tipo = 'teclado';
    else if (nomeMinusculo.includes('monitor') || nomeMinusculo.includes('tela')) tipo = 'monitor';

    // Formata o preço se o usuário não digitou "R$"
    const precoFormatado = preco.startsWith('R$') ? preco : `R$ ${preco}`;

    const novoProduto: Produto = {
      id: Date.now().toString(),
      nome: nome.trim(),
      preco: precoFormatado,
      quantidade: quantidade.trim(),
      tipo,
    };

    setProdutos(prev => [...prev, novoProduto]);

    // Limpa os inputs
    setNome('');
    setPreco('');
    setQuantidade('');
    Keyboard.dismiss();
  };

  // Retorna o ícone correto de acordo com o produto
  const renderIconeProduto = (tipo?: string) => {
    switch (tipo) {
      case 'notebook':
        return <MaterialCommunityIcons name="laptop" size={36} color="#047857" />;
      case 'mouse':
        return <MaterialCommunityIcons name="mouse" size={36} color="#047857" />;
      case 'teclado':
        return <MaterialCommunityIcons name="keyboard-outline" size={36} color="#047857" />;
      case 'monitor':
        return <MaterialCommunityIcons name="monitor" size={36} color="#047857" />;
      default:
        return <MaterialCommunityIcons name="package-variant-closed" size={36} color="#047857" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#047857" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Nome do Produto */}
        <View style={styles.inputContainer}>
          <Feather name="box" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nome do produto"
            placeholderTextColor="#94A3B8"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* Input Preço */}
        <View style={styles.inputContainer}>
          <Feather name="dollar-sign" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Preço (R$)"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={preco}
            onChangeText={setPreco}
          />
        </View>

        {/* Input Quantidade */}
        <View style={styles.inputContainer}>
          <Feather name="list" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Quantidade"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={quantidade}
            onChangeText={setQuantidade}
          />
        </View>

        {/* Botão Adicionar Produto */}
        <TouchableOpacity style={styles.addBtn} onPress={adicionarProduto}>
          <Feather name="plus" size={20} color="#FFFFFF" style={styles.addBtnIcon} />
          <Text style={styles.addBtnText}>Adicionar Produto</Text>
        </TouchableOpacity>

        {/* Lista de Produtos renderizada com .map() */}
        <View style={styles.productsList}>
          {produtos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
            </View>
          ) : (
            produtos.map((produto) => (
              <View key={produto.id} style={styles.productCard}>
                <View style={styles.iconBox}>
                  {renderIconeProduto(produto.tipo)}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productNome}>{produto.nome}</Text>
                  <Text style={styles.productPreco}>{produto.preco}</Text>
                  <Text style={styles.productQtde}>Qtde: {produto.quantidade}</Text>
                </View>

                <View style={styles.chevronBox}>
                  <Feather name="chevron-right" size={22} color="#047857" />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Botão para voltar ao Hub */}
        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={() => router.push('/')}
        >
          <Text style={styles.voltarBtnText}>Voltar para o Hub</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
