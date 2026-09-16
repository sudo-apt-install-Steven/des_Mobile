import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../../../styles/atividade10_styles';

export default function Subpagina2() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'ano'>('semana');

  const dias = [
    { dia: 'Seg', altura: 70, ativo: false },
    { dia: 'Ter', altura: 95, ativo: false },
    { dia: 'Qua', altura: 110, ativo: true },
    { dia: 'Qui', altura: 60, ativo: false },
    { dia: 'Sex', altura: 85, ativo: false },
    { dia: 'Sab', altura: 100, ativo: false },
    { dia: 'Dom', altura: 45, ativo: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Relatórios</Text>
            <Text style={styles.dateSubtitle}>Subpágina 2 · Análise de Desempenho</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Voltar ao Hub</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterPillRow}>
          <TouchableOpacity
            style={[styles.filterPill, periodo === 'semana' ? styles.filterPillActive : null]}
            onPress={() => setPeriodo('semana')}
          >
            <Text style={[styles.filterPillText, periodo === 'semana' ? styles.filterPillTextActive : null]}>Semana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, periodo === 'mes' ? styles.filterPillActive : null]}
            onPress={() => setPeriodo('mes')}
          >
            <Text style={[styles.filterPillText, periodo === 'mes' ? styles.filterPillTextActive : null]}>Mês</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, periodo === 'ano' ? styles.filterPillActive : null]}
            onPress={() => setPeriodo('ano')}
          >
            <Text style={[styles.filterPillText, periodo === 'ano' ? styles.filterPillTextActive : null]}>Ano</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.heroBadgeRow}>
            <Text style={styles.heroValueTitle}>Atividade Semanal (kcal)</Text>
            <Text style={[styles.statusText, { color: '#0EA5E9' }]}>+18% vs semana ant.</Text>
          </View>

          <View style={styles.chartContainer}>
            {dias.map((item, idx) => (
              <View key={idx} style={styles.chartColumn}>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarActive,
                      { height: item.altura },
                      item.ativo ? styles.chartBarHighlight : null,
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayLabel, item.ativo ? styles.chartDayLabelActive : null]}>
                  {item.dia}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>6 / 7</Text>
            <Text style={styles.metricCardLabel}>Dias Ativos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>48 min</Text>
            <Text style={styles.metricCardLabel}>Média Diária</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>3.840</Text>
            <Text style={styles.metricCardLabel}>kcal total</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Distribuição de Treinos</Text>

        <View style={styles.glassCard}>
          <View style={styles.activityItem}>
            <View>
              <Text style={styles.activityTitle}>Treino Cardiovascular</Text>
              <Text style={styles.activitySubtitle}>3 sessões concluídas</Text>
            </View>
            <Text style={styles.activityValue}>45%</Text>
          </View>

          <View style={styles.activityItem}>
            <View>
              <Text style={styles.activityTitle}>Musculação & Força</Text>
              <Text style={styles.activitySubtitle}>4 sessões concluídas</Text>
            </View>
            <Text style={[styles.activityValue, { color: '#10B981' }]}>35%</Text>
          </View>

          <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.activityTitle}>Alongamento & Mobilidade</Text>
              <Text style={styles.activitySubtitle}>2 sessões concluídas</Text>
            </View>
            <Text style={[styles.activityValue, { color: '#F59E0B' }]}>20%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
