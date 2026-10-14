import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/atividade12_styles';

export default function LanchonetePedido() {
  const handleVoltarAoInicio = () => {
    // router.dismissAll() desempilha todas as telas da Stack e volta para a raiz (Home)
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/Atividade12_Lanchonete');
    }
  };

  const handleAlterarPedido = () => {
    // Volta uma tela na pilha para revisar o cardápio
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.wrapperMaxWidth}>
        <View style={styles.contentCenter}>
          {/* Círculo verde com texto OK */}
          <View style={styles.okCircle}>
            <Text style={styles.okText}>OK</Text>
          </View>

          <Text style={styles.pedidoTitle}>Pedido confirmado!</Text>
          <Text style={styles.pedidoSubtitle}>Em breve ficará pronto.</Text>
        </View>

        <View>
          <TouchableOpacity
            style={styles.buttonDark}
            onPress={handleVoltarAoInicio}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonDarkText}>Voltar ao início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleAlterarPedido}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color="#64748B" />
            <Text style={styles.secondaryButtonText}>Alterar pedido (router.back)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
