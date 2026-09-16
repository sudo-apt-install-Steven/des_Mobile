import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { styles } from '../../../styles/atividade10_styles';

export default function Subpagina3() {
  const [notificacoes, setNotificacoes] = useState(true);
  const [sincronizacao, setSincronizacao] = useState(true);
  const [metaInteligente, setMetaInteligente] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Perfil</Text>
            <Text style={styles.dateSubtitle}>Subpágina 3 · Conta & Ajustes</Text>
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
          <View style={styles.profileAvatarRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitials}>SM</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Steven Melo</Text>
              <Text style={styles.profileRole}>Desenvolvedor Mobile · IFRO</Text>
              <View style={[styles.statusBadge, { marginTop: 6, alignSelf: 'flex-start' }]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Membro Ativo</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Preferências do Aplicativo</Text>

        <View style={styles.glassCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notificações Diárias</Text>
            <TouchableOpacity
              style={[styles.toggleSwitch, notificacoes ? styles.toggleSwitchActive : null]}
              onPress={() => setNotificacoes(!notificacoes)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, notificacoes ? styles.toggleThumbActive : null]} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sincronização em Nuvem</Text>
            <TouchableOpacity
              style={[styles.toggleSwitch, sincronizacao ? styles.toggleSwitchActive : null]}
              onPress={() => setSincronizacao(!sincronizacao)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, sincronizacao ? styles.toggleThumbActive : null]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>Ajuste Automático de Metas</Text>
            <TouchableOpacity
              style={[styles.toggleSwitch, metaInteligente ? styles.toggleSwitchActive : null]}
              onPress={() => setMetaInteligente(!metaInteligente)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, metaInteligente ? styles.toggleThumbActive : null]} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Conquistas Desbloqueadas</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>🔥 7d</Text>
            <Text style={styles.metricCardLabel}>Sequência</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>🎯 100%</Text>
            <Text style={styles.metricCardLabel}>Meta Semanal</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardValue}>🏆 Pro</Text>
            <Text style={styles.metricCardLabel}>Nível Aluno</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#334155' }]}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Sair para o Hub de Atividades</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
