import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { styles } from '../../styles/atividade12_styles';

export default function LanchoneteDrawerHome() {
  const handleVerCardapio = () => {
    // Navega para o Cardápio usando router.push (conforme requisito)
    router.push('/Atividade13_Lanchonete_Drawer/cardapio');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.wrapperMaxWidth}>
        <View style={styles.contentCenter}>
          <Text style={styles.homeTitle}>Lanchonete do IFRO</Text>
          <Text style={styles.homeSubtitle}>Bem-vindo! Faça seu pedido.</Text>
        </View>

        <TouchableOpacity
          style={styles.buttonBlue}
          onPress={handleVerCardapio}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonBlueText}>Ver cardápio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
