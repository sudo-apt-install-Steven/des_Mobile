import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/atividade12_styles';

const ITENS_CARDAPIO = [
  { id: '1', nome: 'X-Burger', preco: 'R$ 18,00' },
  { id: '2', nome: 'Pizza fatia', preco: 'R$ 9,00' },
  { id: '3', nome: 'Suco natural', preco: 'R$ 7,50' },
];

export default function LanchoneteDrawerCardapio() {
  const handleFazerPedido = () => {
    // Empilha a tela de confirmação de pedido usando router.push (conforme requisito)
    router.push('/Atividade13_Lanchonete_Drawer/pedido');
  };

  const handleVoltar = () => {
    // Retorna para a tela anterior usando router.back (conforme requisito)
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.wrapperMaxWidth}>
        <ScrollView
          style={styles.cardapioList}
          showsVerticalScrollIndicator={false}
        >
          {ITENS_CARDAPIO.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemPreco}>{item.preco}</Text>
            </View>
          ))}
        </ScrollView>

        <View>
          <TouchableOpacity
            style={styles.buttonBlue}
            onPress={handleFazerPedido}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonBlueText}>Fazer pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleVoltar}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color="#64748B" />
            <Text style={styles.secondaryButtonText}>Voltar (router.back)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
