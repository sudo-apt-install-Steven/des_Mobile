import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../../styles/atividade10_styles';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Olá, Steven 👋</Text>
            <Text style={styles.dateSubtitle}>Quarta-feira, 16 de Setembro</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Voltar ao Hub</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Plano Ativo</Text>
            </View>
            <Text style={styles.heroSubtitle}>Meta: 10.000 passos</Text>
          </View>

          <Text style={styles.heroValueTitle}>Passos de Hoje</Text>
          <Text style={styles.heroMainValue}>8.420</Text>
          <Text style={styles.heroSubtitle}>84% da sua meta diária concluída</Text>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '84%' }]} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapper}>
              <Image source={require('../../../assets/icons/fire.png')} style={styles.metricIcon} resizeMode="contain" />
            </View>
            <Text style={styles.metricCardValue}>640</Text>
            <Text style={styles.metricCardLabel}>kcal queimadas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapper}>
              <Image source={require('../../../assets/icons/water.png')} style={styles.metricIcon} resizeMode="contain" />
            </View>
            <Text style={styles.metricCardValue}>1.8 L</Text>
            <Text style={styles.metricCardLabel}>água ingerida</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapper}>
              <Image source={require('../../../assets/icons/heart.png')} style={styles.metricIcon} resizeMode="contain" />
            </View>
            <Text style={styles.metricCardValue}>72</Text>
            <Text style={styles.metricCardLabel}>bpm médio</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Atividades de Hoje</Text>

        <View style={styles.glassCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View style={styles.activityIconCircle}>
                <Image source={require('../../../assets/icons/fire.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.activityTitle}>Caminhada ao Ar Livre</Text>
                <Text style={styles.activitySubtitle}>Manhã · 42 min</Text>
              </View>
            </View>
            <Text style={styles.activityValue}>+280 kcal</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View style={styles.activityIconCircle}>
                <Image source={require('../../../assets/icons/water.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.activityTitle}>Lembrete de Hidratação</Text>
                <Text style={styles.activitySubtitle}>5 copos registrados</Text>
              </View>
            </View>
            <Text style={[styles.activityValue, { color: '#0284C7' }]}>1.250 ml</Text>
          </View>

          <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
            <View style={styles.activityLeft}>
              <View style={styles.activityIconCircle}>
                <Image source={require('../../../assets/icons/heart.png')} style={{ width: 18, height: 18 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.activityTitle}>Treino Funcional</Text>
                <Text style={styles.activitySubtitle}>Tarde · 35 min</Text>
              </View>
            </View>
            <Text style={styles.activityValue}>+360 kcal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
