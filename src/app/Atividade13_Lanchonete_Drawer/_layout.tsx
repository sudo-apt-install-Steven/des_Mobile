import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/atividade12_styles';

export default function LanchoneteDrawerLayout() {
  return (
    <Drawer
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
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
        drawerStyle: {
          backgroundColor: '#0F172A',
          width: 260,
        },
        drawerActiveTintColor: '#38BDF8',
        drawerInactiveTintColor: '#94A3B8',
        drawerActiveBackgroundColor: 'rgba(56, 189, 248, 0.12)',
        drawerLabelStyle: {
          fontWeight: '700',
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
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
      <Drawer.Screen
        name="cardapio"
        options={{
          drawerLabel: 'Cardápio',
          title: 'Cardápio',
          drawerIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
          headerLeft: (props) => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingRight: 6 }}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
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
      <Drawer.Screen
        name="pedido"
        options={{
          drawerLabel: 'Pedido',
          title: 'Pedido',
          drawerIcon: ({ color, size }) => (
            <Feather name="check-circle" size={size} color={color} />
          ),
          headerLeft: (props) => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingRight: 6 }}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
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
    </Drawer>
  );
}
