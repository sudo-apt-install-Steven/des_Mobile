import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styles, PIZZARIA_COLORS } from '../../styles/atividade15_pizzariatop_styles';
import { usePizzariaTop } from './PizzariaTopContext';

export type PizzariaTabKey = 'inicio' | 'montar' | 'pedidos' | 'api_map' | 'perfil';

interface NavTabConfig {
  key: PizzariaTabKey;
  label: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
}

const NAV_TABS: NavTabConfig[] = [
  { key: 'inicio', label: 'Início', route: '/Atividade15_PizzariaTop', icon: 'home' },
  { key: 'montar', label: 'Montar', route: '/Atividade15_PizzariaTop/montar', icon: 'pie-chart' },
  { key: 'pedidos', label: 'Pedidos', route: '/Atividade15_PizzariaTop/pedidos', icon: 'shopping-bag' },
  { key: 'api_map', label: 'API Map', route: '/Atividade15_PizzariaTop/api_map', icon: 'terminal' },
  { key: 'perfil', label: 'Conta', route: '/Atividade15_PizzariaTop/perfil', icon: 'user' },
];

export function PizzariaTopShell({
  activeTab,
  subtitle = 'Forno a Lenha & Delivery',
  children,
}: {
  activeTab: PizzariaTabKey;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { topCoins, cartCount, user } = usePizzariaTop();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.screenRoot}>
        <View style={styles.ambientOrbTop} />
        <View style={styles.ambientOrbBottom} />

        {/* Header PizzariaTop */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderInner}>
            <TouchableOpacity
              style={styles.hubBackBtn}
              onPress={() => router.replace('/')}
              activeOpacity={0.75}
            >
              <Feather name="arrow-left" size={14} color="#FFFFFF" />
              <Text style={styles.hubBackText}>Hub</Text>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.brandIconBox}>
                <FontAwesome5 name="pizza-slice" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandTitle} numberOfLines={1}>
                  PizzariaTop
                </Text>
                <Text style={styles.brandSub} numberOfLines={1}>
                  {user ? `Olá, ${user.nome.split(' ')[0]}` : subtitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.coinsPill}
              onPress={() => router.replace('/Atividade15_PizzariaTop/perfil')}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="coins" size={12} color={PIZZARIA_COLORS.gold} />
              <Text style={styles.coinsPillText}>{topCoins} TC</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo da subtela */}
        <View style={{ flex: 1 }}>{children}</View>

        {/* Barra de navegação inferior fixa */}
        <View style={styles.bottomBarWrap}>
          <View style={styles.bottomBar}>
            {NAV_TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => {
                    if (!isActive) {
                      router.replace(tab.route as any);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={tab.icon}
                    size={18}
                    color={isActive ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {tab.label}
                  </Text>
                  {tab.key === 'pedidos' && cartCount > 0 && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{cartCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
