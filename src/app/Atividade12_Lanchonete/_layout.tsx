import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { styles } from '../../styles/atividade12_styles';

export default function LanchoneteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A', // Azul-escuro
        },
        headerTintColor: '#FFFFFF', // Título e seta de voltar brancos
        headerTitleStyle: {
          fontWeight: '700',
          color: '#FFFFFF',
          fontSize: 18,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerRight: () => (
            <TouchableOpacity
              style={styles.hubHeaderBtn}
              onPress={() => router.replace('/')}
              activeOpacity={0.7}
            >
              <Text style={styles.hubHeaderBtnText}>Hub</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="cardapio"
        options={{
          title: 'Cardápio',
        }}
      />
      <Stack.Screen
        name="pedido"
        options={{
          title: 'Pedido',
        }}
      />
    </Stack>
  );
}
