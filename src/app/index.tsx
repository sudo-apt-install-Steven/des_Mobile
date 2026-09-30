import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from '../styles/hub_styles';
import { useResponsive, useNativeDriver } from '../hooks/useResponsive';

type BimestreFilter = 'todos' | '2' | '1';

interface ActivityItem {
  id: string;
  route: string;
  number: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  badge?: string;
}

const ATIVIDADES_1_BIMESTRE: ActivityItem[] = [
  {
    id: '1',
    route: '/Atividade1',
    number: '01',
    title: 'Atividade 1',
    description: 'Foto e Botões interativos',
    icon: 'image',
  },
  {
    id: '2',
    route: '/Atividade2',
    number: '02',
    title: 'Atividade 2',
    description: 'Tela de Login e validação',
    icon: 'log-in',
  },
  {
    id: '3_contato',
    route: '/Atividade3_Contato',
    number: '03',
    title: 'Atividade 3 (Contato)',
    description: 'Formulário de Cadastro de Contato',
    icon: 'user-plus',
  },
  {
    id: '3_aluno',
    route: '/Atividade3_Aluno',
    number: '03',
    title: 'Atividade 3 (Aluno)',
    description: 'Formulário de Cadastro de Aluno',
    icon: 'book-open',
  },
  {
    id: '4',
    route: '/Atividade4',
    number: '04',
    title: 'Atividade 4',
    description: 'Contador interativo com useState',
    icon: 'plus-circle',
  },
  {
    id: '5',
    route: '/Atividade5',
    number: '05',
    title: 'Atividade 5',
    description: 'Cadastro de Usuário',
    icon: 'user-check',
  },
  {
    id: '6',
    route: '/Atividade6',
    number: '06',
    title: 'Atividade 6',
    description: 'Cálculo de Ração Animal',
    icon: 'pie-chart',
  },
  {
    id: '7',
    route: '/Atividade7',
    number: '07',
    title: 'Atividade 7',
    description: 'Simulador de Seguro Veicular',
    icon: 'shield',
  },
  {
    id: '8',
    route: '/Atividade8_map',
    number: '08',
    title: 'Atividade 8',
    description: 'Cadastro e Listagem com Map',
    icon: 'list',
  },
  {
    id: '9_flatlist',
    route: '/Atividade9_FlatList',
    number: '09',
    title: 'Atividade 9 (Tarefas)',
    description: 'Lista otimizada com FlatList',
    icon: 'check-square',
  },
  {
    id: '9_map',
    route: '/Atividade9_map',
    number: '09',
    title: 'Atividade 9 (Produtos)',
    description: 'Catálogo de Produtos com Map',
    icon: 'shopping-bag',
  },
  {
    id: '10',
    route: '/Atividade10_tabnav',
    number: '10',
    title: 'Atividade 10',
    description: 'Tab Navigation com Glass Effect',
    icon: 'navigation',
  },
];

// Componente animado para cards com toque suave e compatibilidade multiplataforma
function AnimatedCard({
  children,
  onPress,
  style,
  containerStyle,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  containerStyle?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver,
      friction: 4,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={containerStyle}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function Hub() {
  const [filtro, setFiltro] = useState<BimestreFilter>('todos');
  const { isTablet, isDesktop, maxContentWidth } = useResponsive();

  // Media Query: 1 coluna em telefones, 2 em tablets e 3 em desktops
  const cardWidthStyle = isDesktop
    ? { width: '31.8%' as const }
    : isTablet
    ? { width: '48.5%' as const }
    : { width: '100%' as const };

  const show2Bimestre = filtro === 'todos' || filtro === '2';
  const show1Bimestre = filtro === 'todos' || filtro === '1';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Luzes de fundo para efeito Glassmorphism */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, { maxWidth: maxContentWidth }]}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <View style={styles.headerBadgeDot} />
            <Text style={styles.headerBadgeText}>DESENVOLVIMENTO MOBILE</Text>
          </View>
          <Text style={styles.title}>Hub de Atividades</Text>
          <Text style={styles.subtitle}>
            Acesse as entregas organizadas por bimestre letivo
          </Text>
        </View>

        {/* Seletor de Bimestre */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity
            style={[
              styles.selectorTab,
              filtro === 'todos' ? styles.selectorTabActive : null,
            ]}
            onPress={() => setFiltro('todos')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectorTabText,
                filtro === 'todos' ? styles.selectorTabTextActive : null,
              ]}
            >
              Todas
            </Text>
            <View
              style={[
                styles.selectorCountBadge,
                filtro === 'todos' ? styles.selectorCountBadgeActive : null,
              ]}
            >
              <Text
                style={[
                  styles.selectorCountText,
                  filtro === 'todos' ? styles.selectorCountTextActive : null,
                ]}
              >
                13
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorTab,
              filtro === '2' ? styles.selectorTabActive : null,
            ]}
            onPress={() => setFiltro('2')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectorTabText,
                filtro === '2' ? styles.selectorTabTextActive : null,
              ]}
            >
              2º Bimestre
            </Text>
            <View
              style={[
                styles.selectorCountBadge,
                filtro === '2' ? styles.selectorCountBadgeActive : null,
              ]}
            >
              <Text
                style={[
                  styles.selectorCountText,
                  filtro === '2' ? styles.selectorCountTextActive : null,
                ]}
              >
                Novo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorTab,
              filtro === '1' ? styles.selectorTabActive : null,
            ]}
            onPress={() => setFiltro('1')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectorTabText,
                filtro === '1' ? styles.selectorTabTextActive : null,
              ]}
            >
              1º Bimestre
            </Text>
            <View
              style={[
                styles.selectorCountBadge,
                filtro === '1' ? styles.selectorCountBadgeActive : null,
              ]}
            >
              <Text
                style={[
                  styles.selectorCountText,
                  filtro === '1' ? styles.selectorCountTextActive : null,
                ]}
              >
                12
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= 2º BIMESTRE ================= */}
        {show2Bimestre && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIndicatorDotWine} />
                <Text style={styles.sectionTitle}>2º Bimestre (Atual)</Text>
              </View>
              <Text style={styles.sectionTag}>Em Andamento</Text>
            </View>

            {/* Atividade 11 - Adega Preferida (Hero Card) */}
            <AnimatedCard
              style={styles.featuredCard}
              onPress={() => router.push('/Atividade11_Adega')}
            >
              <View style={styles.specularLine} />
              <View style={styles.featuredCardBody}>
                <View style={styles.featuredBadgeRow}>
                  <View style={styles.featuredBadge}>
                    <FontAwesome5 name="wine-bottle" size={12} color="#FEE2E2" />
                    <Text style={styles.featuredBadgeText}>ATIVIDADE 11 · NOVO</Text>
                  </View>
                  <Text style={styles.featuredNumber}>#2º-01</Text>
                </View>

                <Text style={styles.featuredTitle}>Adega Preferida</Text>
                <Text style={styles.featuredDescription}>
                  Aplicação completa com 3 telas: Início com fundo fotográfico,
                  Catálogo com 4 tipos de vinhos finos e tela de Contato com
                  ícones vetoriais.
                </Text>

                <View style={styles.tagsRow}>
                  <View style={styles.tagChip}>
                    <Text style={styles.tagChipText}>Bottom Tabs</Text>
                  </View>
                  <View style={styles.tagChip}>
                    <Text style={styles.tagChipText}>Vector Icons</Text>
                  </View>
                  <View style={styles.tagChip}>
                    <Text style={styles.tagChipText}>Catálogo</Text>
                  </View>
                  <View style={styles.tagChip}>
                    <Text style={styles.tagChipText}>Modelo Anexo</Text>
                  </View>
                </View>

                <View style={styles.featuredButton}>
                  <Text style={styles.featuredButtonText}>Abrir Aplicação</Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" />
                </View>
              </View>
            </AnimatedCard>

            {/* Placeholder para próximas atividades */}
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderIconBox}>
                <Feather name="clock" size={20} color="#9CA3AF" />
              </View>
              <View>
                <Text style={styles.placeholderTitle}>Próximas Atividades</Text>
                <Text style={styles.placeholderSub}>
                  Atividade 12 e seguintes serão adicionadas aqui
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= 1º BIMESTRE ================= */}
        {show1Bimestre && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIndicatorDot} />
                <Text style={styles.sectionTitle}>1º Bimestre (Concluído)</Text>
              </View>
              <Text style={styles.sectionTag}>12 Atividades</Text>
            </View>

            <View style={styles.cardsContainer}>
              {ATIVIDADES_1_BIMESTRE.map((item) => (
                <AnimatedCard
                  key={item.id}
                  containerStyle={cardWidthStyle}
                  style={styles.glassCard}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.glassCardInner}>
                    <View style={styles.cardIconBox}>
                      <Feather name={item.icon} size={20} color="#C4B5FD" />
                    </View>
                    <View style={styles.cardTextBox}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSubtitle}>{item.description}</Text>
                    </View>
                    <View style={styles.cardArrowBox}>
                      <Feather name="chevron-right" size={16} color="#9CA3AF" />
                    </View>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            React Native · Expo SDK 54+ · Expo Router
          </Text>
          <Text style={styles.footerBadge}>Projetos & Atividades Práticas</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
