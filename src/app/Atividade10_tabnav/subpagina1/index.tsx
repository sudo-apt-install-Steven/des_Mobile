import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../../../styles/atividade10_styles';

export default function Subpagina1() {
  const [pesoAtual, setPesoAtual] = useState(72.4);
  const [historico, setHistorico] = useState([
    { data: '14 Set', peso: '72.8 kg', variacao: '-0.4 kg' },
    { data: '10 Set', peso: '73.1 kg', variacao: '-0.3 kg' },
    { data: '05 Set', peso: '73.6 kg', variacao: '-0.5 kg' },
    { data: '01 Set', peso: '74.2 kg', variacao: '-0.6 kg' },
  ]);

  const registrarPesagem = () => {
    const novoValor = Number((pesoAtual - 0.2).toFixed(1));
    setPesoAtual(novoValor);
    setHistorico(prev => [
      { data: 'Hoje', peso: `${novoValor} kg`, variacao: '-0.2 kg' },
      ...prev,
    ]);
    Alert.alert('Sucesso', `Pesagem de ${novoValor} kg registrada.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Métricas & Peso</Text>
            <Text style={styles.dateSubtitle}>Subpágina 1 · Acompanhamento</Text>
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
            <Text style={styles.heroValueTitle}>Peso Corporal Atual</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Evolução Constante</Text>
            </View>
          </View>

          <Text style={styles.heroMainValue}>{pesoAtual} kg</Text>
          <Text style={styles.heroSubtitle}>Meta final: 70.0 kg (faltam {(pesoAtual - 70.0).toFixed(1)} kg)</Text>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '68%', backgroundColor: '#10B981' }]} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>22.1</Text>
            <Text style={styles.metricCardLabel}>IMC (Normal)</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>16.4%</Text>
            <Text style={styles.metricCardLabel}>Gordura Corp.</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>58.2 kg</Text>
            <Text style={styles.metricCardLabel}>Massa Magra</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Histórico Recente</Text>

        <View style={styles.glassCard}>
          {historico.map((item, index) => (
            <View
              key={index}
              style={[
                styles.activityItem,
                index === historico.length - 1 ? { borderBottomWidth: 0 } : null,
              ]}
            >
              <View>
                <Text style={styles.activityTitle}>{item.peso}</Text>
                <Text style={styles.activitySubtitle}>{item.data}</Text>
              </View>
              <Text style={[styles.activityValue, { color: '#10B981' }]}>{item.variacao}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={registrarPesagem}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>+ Registrar Nova Pesagem</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
