import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../../../styles/atividade10_styles';

export default function Subpagina4() {
  const notificacoes = [
    {
      id: '1',
      titulo: 'Meta Diária Concluída',
      descricao: 'Você atingiu 8.000 passos hoje. Continue assim!',
      horario: 'Há 25 min',
      icone: require('../../../assets/icons/fire.png'),
    },
    {
      id: '2',
      titulo: 'Hora de se Hidratar',
      descricao: 'Beba 250ml de água para manter o ritmo de hoje.',
      horario: 'Há 1 hora',
      icone: require('../../../assets/icons/water.png'),
    },
    {
      id: '3',
      titulo: 'Batimento Cardíaco Estável',
      descricao: 'Sua frequência média pós-treino foi de 72 bpm.',
      horario: 'Há 3 horas',
      icone: require('../../../assets/icons/heart.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Notificações</Text>
            <Text style={styles.dateSubtitle}>Subpágina 4 · Alertas & Atualizações</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/Atividade10_tabnav')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Voltar às Abas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Recentes</Text>

        <View style={styles.glassCard}>
          {notificacoes.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityItem,
                index === notificacoes.length - 1 ? { borderBottomWidth: 0 } : null,
              ]}
            >
              <View style={styles.activityLeft}>
                <View style={styles.activityIconCircle}>
                  <Image source={item.icone} style={{ width: 18, height: 18 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{item.titulo}</Text>
                  <Text style={styles.activitySubtitle}>{item.descricao}</Text>
                </View>
              </View>
              <Text style={[styles.activitySubtitle, { fontSize: 11 }]}>{item.horario}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { marginTop: 10 }]}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Voltar ao Hub Principal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
