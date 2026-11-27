import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useResponsive } from '../../hooks/useResponsive';
import { LOGO_PIZZARIATOP } from '../../utils/pizzaImageMap';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { NavStyleMode, usePizzariaTop } from './PizzariaTopContext';
import { SmartWaiterModal } from './SmartWaiterModal';

export type PizzariaTabKey =
  | 'inicio'
  | 'sabores'
  | 'ingredientes'
  | 'montar'
  | 'pedidos'
  | 'reservas'
  | 'avaliacoes'
  | 'clube_admin'
  | 'api_map'
  | 'perfil';

export interface PizzariaNavItem {
  key: PizzariaTabKey;
  label: string;
  staffLabel?: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  staffIcon?: keyof typeof Feather.glyphMap;
}

export const PIZZARIA_NAV_ITEMS: PizzariaNavItem[] = [
  { key: 'inicio', label: 'Início', route: '/Atividade15_PizzariaTop', icon: 'home' },
  { key: 'sabores', label: 'Sabores', route: '/Atividade15_PizzariaTop/sabores', icon: 'disc' },
  {
    key: 'ingredientes',
    label: 'Ingredientes',
    route: '/Atividade15_PizzariaTop/ingredientes',
    icon: 'layers',
  },
  {
    key: 'montar',
    label: 'Montar',
    route: '/Atividade15_PizzariaTop/montar',
    icon: 'pie-chart',
  },
  {
    key: 'pedidos',
    label: 'Pedidos',
    route: '/Atividade15_PizzariaTop/pedidos',
    icon: 'shopping-bag',
  },
  {
    key: 'reservas',
    label: 'Reservas',
    route: '/Atividade15_PizzariaTop/reservas',
    icon: 'calendar',
  },
  {
    key: 'avaliacoes',
    label: 'Avaliações',
    route: '/Atividade15_PizzariaTop/avaliacoes',
    icon: 'star',
  },
  {
    key: 'clube_admin',
    label: 'Clube VIP',
    staffLabel: 'Painel',
    route: '/Atividade15_PizzariaTop/clube_admin',
    icon: 'award',
    staffIcon: 'grid',
  },
  {
    key: 'perfil',
    label: 'Perfil',
    route: '/Atividade15_PizzariaTop/perfil',
    icon: 'user',
  },
  {
    key: 'api_map',
    label: 'API Map',
    route: '/Atividade15_PizzariaTop/api_map',
    icon: 'terminal',
  },
];

export const NAV_MODE_OPTIONS: Array<{
  mode: NavStyleMode;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  {
    mode: 'dock',
    shortLabel: 'Dock',
    title: 'Dock Flutuante (Oficial)',
    subtitle: 'Cápsula glass responsiva celular/PC com glow ativo',
    icon: 'smartphone',
  },
  {
    mode: 'classic',
    shortLabel: 'Topo',
    title: 'Barra Superior (Clássico)',
    subtitle: 'Navegação horizontal fixa abaixo do cabeçalho',
    icon: 'layout',
  },
  {
    mode: 'sidebar',
    shortLabel: 'Lateral',
    title: 'Sidebar Lateral (PC / Drawer)',
    subtitle: 'Coluna fixa 240px no PC (>=900px) ou gaveta no celular',
    icon: 'sidebar',
  },
  {
    mode: 'floating',
    shortLabel: 'FAB',
    title: 'Botão Flutuante (Leque FAB)',
    subtitle: 'Botão circular no canto inferior expandindo leque rápido',
    icon: 'compass',
  },
];

function createActiveGlowShadow(shadowRgba: string, hexColor: string) {
  if (Platform.OS === 'web') {
    return { boxShadow: `0px 0px 15px ${shadowRgba}` } as any;
  }
  return {
    shadowColor: hexColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  };
}

export function PizzariaTopShell({
  activeTab,
  subtitle = 'Forno a Lenha · API REST',
  children,
}: {
  activeTab: PizzariaTabKey;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { width } = useResponsive();
  const {
    user,
    topCoins,
    cartCount,
    unreadNotifs,
    isVip,
    navStyle,
    setNavStyle,
    smartWaiterVisible,
    openSmartWaiter,
    closeSmartWaiter,
  } = usePizzariaTop();

  const [navPickerOpen, setNavPickerOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const isDesktopDock = width >= 768;
  const isFixedSidebar = width >= 900;

  const roleLower = String(user?.tipo_usuario ?? '').toLowerCase();
  const isStaff =
    Boolean(user) &&
    (roleLower === 'admin' || roleLower === 'funcionario' || roleLower === 'gerente');

  // Tema fiel ao DockMenu.jsx / NavigationManager.jsx: Violeta para Admin/Staff, Dourado para Cliente
  const themeColor = isStaff ? PIZZARIA_COLORS.themeStaff : PIZZARIA_COLORS.themeClient;
  const themeBg = isStaff ? PIZZARIA_COLORS.themeStaffBg : PIZZARIA_COLORS.themeClientBg;
  const themeShadow = isStaff
    ? PIZZARIA_COLORS.themeStaffShadow
    : PIZZARIA_COLORS.themeClientShadow;

  const activeGlowStyle = useMemo(
    () => createActiveGlowShadow(themeShadow, themeColor),
    [themeShadow, themeColor]
  );

  const firstName = user?.nome ? user.nome.trim().split(/\s+/)[0] : null;
  const currentNavMeta =
    NAV_MODE_OPTIONS.find((opt) => opt.mode === navStyle) ?? NAV_MODE_OPTIONS[0];

  const getBadgeForTab = (key: PizzariaTabKey): number => {
    if (key === 'pedidos') return cartCount;
    if (key === 'perfil') return unreadNotifs;
    return 0;
  };

  const navigateToTab = (tab: PizzariaNavItem) => {
    setMobileSidebarOpen(false);
    setFabOpen(false);
    if (tab.key !== activeTab) {
      router.replace(tab.route as any);
    }
  };

  const renderSidebarContent = () => (
    <>
      <View style={{ flex: 1 }}>
        <Text style={styles.sidebarSectionLabel}>
          {isStaff ? 'Painel Staff / Admin' : 'Navegação Pizzaria TOP'}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {PIZZARIA_NAV_ITEMS.map((tab) => {
            const isActive = tab.key === activeTab;
            const label = isStaff && tab.staffLabel ? tab.staffLabel : tab.label;
            const icon = isStaff && tab.staffIcon ? tab.staffIcon : tab.icon;
            const badge = getBadgeForTab(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.sidebarItem,
                  isActive && {
                    backgroundColor: themeBg,
                    borderColor: themeColor,
                  },
                ]}
                onPress={() => navigateToTab(tab)}
                activeOpacity={0.8}
              >
                <View style={styles.sidebarItemLeft}>
                  <Feather
                    name={icon}
                    size={18}
                    color={isActive ? themeColor : 'rgba(255,255,255,0.7)'}
                  />
                  <Text
                    style={[
                      styles.sidebarItemText,
                      isActive && { color: themeColor, fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>

                {badge > 0 ? (
                  <View style={[styles.dockBadge, { position: 'relative', top: 0, right: 0 }]}>
                    <Text style={styles.dockBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.aiHeaderBtn,
          { justifyContent: 'center', paddingVertical: 10, marginTop: 10 },
        ]}
        onPress={() => {
          setMobileSidebarOpen(false);
          openSmartWaiter();
        }}
        activeOpacity={0.85}
      >
        <Feather name="cpu" size={14} color="#111827" />
        <Text style={styles.aiHeaderBtnText}>Abrir Garçom IA ✨</Text>
      </TouchableOpacity>
    </>
  );

  const renderActionPills = () => (
    <>
      {isVip ? (
        <TouchableOpacity
          style={styles.vipHeaderPill}
          onPress={() => router.replace('/Atividade15_PizzariaTop/clube_admin' as any)}
          activeOpacity={0.8}
        >
          <Feather name="star" size={12} color="#FACC15" />
          <Text style={styles.vipHeaderPillText}>VIP</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.coinsPill}
        onPress={() => router.replace('/Atividade15_PizzariaTop/clube_admin' as any)}
        activeOpacity={0.8}
      >
        <Feather name="zap" size={12} color="#FACC15" />
        <Text style={styles.coinsPillText}>{topCoins} TopCoins</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.aiHeaderBtn}
        onPress={openSmartWaiter}
        activeOpacity={0.85}
      >
        <Feather name="message-circle" size={13} color="#111827" />
        <Text style={styles.aiHeaderBtnText}>Garçom IA ✨</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navModeBtn}
        onPress={() => setNavPickerOpen(true)}
        activeOpacity={0.8}
      >
        <Feather name={currentNavMeta.icon} size={12} color={themeColor} />
        <Text style={styles.navModeBtnText}>{currentNavMeta.shortLabel}</Text>
        <Feather name="chevron-down" size={11} color="#E5E7EB" />
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.screenRoot}>
        <View style={styles.ambientOrbTop} />
        <View style={styles.ambientOrbBottom} />

        {/* Header Superior Oficial Pizzaria TOP */}
        <View style={[styles.topHeader, isStaff && styles.topHeaderStaff]}>
          <View style={styles.topHeaderGlowRight} />
          <View style={styles.topHeaderInner}>
            <TouchableOpacity
              style={styles.hubBackBtn}
              onPress={() => router.replace('/')}
              activeOpacity={0.75}
            >
              <Feather name="arrow-left" size={14} color="#FFFFFF" />
              <Text style={styles.hubBackText}>Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.brandRow}
              onPress={() => {
                if (activeTab !== 'inicio') {
                  router.replace('/Atividade15_PizzariaTop');
                }
              }}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.brandIconBox,
                  isStaff && { borderColor: PIZZARIA_COLORS.themeStaff },
                ]}
              >
                <Image
                  source={LOGO_PIZZARIATOP}
                  style={styles.officialLogoImg}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandTitle} numberOfLines={1}>
                  Pizzaria TOP
                </Text>
                <Text
                  style={[
                    styles.brandSub,
                    isStaff && { color: '#DDD6FE' },
                  ]}
                  numberOfLines={1}
                >
                  {firstName ? `Olá, ${firstName}! · ${subtitle}` : subtitle}
                </Text>
              </View>
            </TouchableOpacity>

            {isDesktopDock ? (
              <View style={[styles.rowGap, { gap: 8 }]}>{renderActionPills()}</View>
            ) : null}

            <TouchableOpacity
              style={[styles.headerAuthPill, isStaff && styles.headerAuthPillActive]}
              onPress={() => router.replace('/Atividade15_PizzariaTop/perfil')}
              activeOpacity={0.8}
            >
              <Feather
                name={isStaff ? 'shield' : user ? 'user-check' : 'user'}
                size={13}
                color={isStaff ? '#C4B5FD' : '#FACC15'}
              />
              <Text style={styles.headerAuthPillText} numberOfLines={1}>
                {isStaff ? 'Admin' : firstName ? firstName : 'Conta'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Faixa compacta de ações em telas Mobile (<768px) */}
          {!isDesktopDock ? (
            <View style={styles.topHeaderActionsStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topHeaderActionsScroll}
              >
                {renderActionPills()}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Modo 2: Classic Top Navigation Bar */}
        {navStyle === 'classic' ? (
          <View
            style={[
              styles.classicBarWrap,
              { borderBottomColor: isStaff ? 'rgba(139,92,246,0.4)' : 'rgba(250,204,21,0.38)' },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classicBarScroll}
            >
              {PIZZARIA_NAV_ITEMS.map((tab) => {
                const isActive = tab.key === activeTab;
                const label = isStaff && tab.staffLabel ? tab.staffLabel : tab.label;
                const icon = isStaff && tab.staffIcon ? tab.staffIcon : tab.icon;
                const badge = getBadgeForTab(tab.key);
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.classicNavItem,
                      isActive && {
                        backgroundColor: themeBg,
                        borderWidth: 1,
                        borderColor: themeColor,
                      },
                    ]}
                    onPress={() => navigateToTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={icon}
                      size={17}
                      color={isActive ? themeColor : 'rgba(255,255,255,0.7)'}
                    />
                    <Text
                      style={[
                        styles.classicNavText,
                        isActive && { color: themeColor, fontWeight: '800' },
                      ]}
                    >
                      {label}
                    </Text>
                    {badge > 0 ? (
                      <View
                        style={[styles.dockBadge, { position: 'relative', top: 0, right: 0 }]}
                      >
                        <Text style={styles.dockBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Modo 3 (Mobile <900px): Barra gatilho para abrir o Drawer Lateral */}
        {navStyle === 'sidebar' && !isFixedSidebar ? (
          <View style={styles.sidebarMobileTriggerBar}>
            <TouchableOpacity
              style={[styles.rowGap, { gap: 8 }]}
              onPress={() => setMobileSidebarOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="menu" size={18} color={themeColor} />
              <Text style={{ color: '#F9FAFB', fontSize: 13, fontWeight: '800' }}>
                Abrir Menu Lateral
              </Text>
            </TouchableOpacity>
            <Text style={{ color: themeColor, fontSize: 11.5, fontWeight: '700' }}>
              Modo Sidebar
            </Text>
          </View>
        ) : null}

        {/* Área Principal (+ Sidebar Fixa 240px no PC >=900px quando navStyle === 'sidebar') */}
        <View style={styles.shellBodyRow}>
          {navStyle === 'sidebar' && isFixedSidebar ? (
            <View style={[styles.sidebarFixed, { borderRightColor: `${themeColor}80` }]}>
              {renderSidebarContent()}
            </View>
          ) : null}

          <View style={{ flex: 1 }}>{children}</View>
        </View>

        {/* Modo 1: DockMenu Oficial Responsiva (Mobile <768px vs PC >=768px) */}
        {navStyle === 'dock' ? (
          <View
            pointerEvents="box-none"
            style={isDesktopDock ? styles.dockOuterDesktop : styles.dockOuterMobile}
          >
            <View style={isDesktopDock ? styles.dockGlassDesktop : styles.dockGlassMobile}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dockScrollContent}
              >
                {PIZZARIA_NAV_ITEMS.map((tab) => {
                  const isActive = tab.key === activeTab;
                  const label = isStaff && tab.staffLabel ? tab.staffLabel : tab.label;
                  const icon = isStaff && tab.staffIcon ? tab.staffIcon : tab.icon;
                  const badge = getBadgeForTab(tab.key);

                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={styles.dockItem}
                      onPress={() => navigateToTab(tab)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          isDesktopDock
                            ? styles.dockIconCircleDesktop
                            : styles.dockIconCircleMobile,
                          isActive && {
                            backgroundColor: themeBg,
                            ...activeGlowStyle,
                          },
                        ]}
                      >
                        <Feather
                          name={icon}
                          size={isDesktopDock ? 22 : 20}
                          color={isActive ? themeColor : 'rgba(255, 255, 255, 0.62)'}
                        />
                        {badge > 0 ? (
                          <View style={styles.dockBadge}>
                            <Text style={styles.dockBadgeText}>
                              {badge > 99 ? '99+' : badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          isDesktopDock ? styles.dockLabelDesktop : styles.dockLabelMobile,
                          isActive && { color: themeColor, fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>

                      <View
                        style={[
                          styles.dockIndicatorDot,
                          {
                            backgroundColor: isActive ? themeColor : 'transparent',
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}

        {/* Modo 4: FAB Leque (`floating` — botão 60x60 canto inferior direito + botões 50x50) */}
        {navStyle === 'floating' ? (
          <>
            {fabOpen ? (
              <Pressable
                style={styles.floatingBackdrop}
                onPress={() => setFabOpen(false)}
              />
            ) : null}
            <View pointerEvents="box-none" style={styles.floatingWrap}>
              {fabOpen ? (
                <ScrollView
                  style={styles.floatingFanScroll}
                  contentContainerStyle={styles.floatingFanColumn}
                  showsVerticalScrollIndicator={false}
                >
                  {PIZZARIA_NAV_ITEMS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const label = isStaff && tab.staffLabel ? tab.staffLabel : tab.label;
                    const icon = isStaff && tab.staffIcon ? tab.staffIcon : tab.icon;
                    const badge = getBadgeForTab(tab.key);

                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={styles.floatingFanRow}
                        onPress={() => navigateToTab(tab)}
                        activeOpacity={0.85}
                      >
                        <View
                          style={[
                            styles.floatingFanLabelPill,
                            isActive && { borderColor: themeColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.floatingFanLabelText,
                              isActive && { color: themeColor },
                            ]}
                          >
                            {label}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.floatingFanBtn,
                            isActive && {
                              borderColor: themeColor,
                              backgroundColor: themeBg,
                            },
                          ]}
                        >
                          <Feather
                            name={icon}
                            size={20}
                            color={isActive ? themeColor : '#F9FAFB'}
                          />
                          {badge > 0 ? (
                            <View style={styles.dockBadge}>
                              <Text style={styles.dockBadgeText}>
                                {badge > 99 ? '99+' : badge}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              <TouchableOpacity
                style={[styles.floatingMainFab, { backgroundColor: themeColor }]}
                onPress={() => setFabOpen((prev) => !prev)}
                activeOpacity={0.85}
                accessibilityLabel="Menu flutuante Pizzaria TOP"
              >
                <Feather
                  name={fabOpen ? 'x' : 'menu'}
                  size={28}
                  color="#111827"
                />
                {!fabOpen && cartCount > 0 ? (
                  <View style={styles.dockBadge}>
                    <Text style={styles.dockBadgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Drawer Modal para Sidebar em telas <900px */}
        <Modal
          visible={navStyle === 'sidebar' && !isFixedSidebar && mobileSidebarOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMobileSidebarOpen(false)}
        >
          <Pressable
            style={styles.sidebarDrawerOverlay}
            onPress={() => setMobileSidebarOpen(false)}
          >
            <Pressable
              style={[styles.sidebarDrawerPanel, { borderRightColor: `${themeColor}80` }]}
              onPress={(e) => e.stopPropagation()}
            >
              {renderSidebarContent()}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Seletor Popover de Estilo de Navegação (Dock · Topo · Lateral · FAB) */}
        <Modal
          visible={navPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setNavPickerOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setNavPickerOpen(false)}
          >
            <Pressable
              style={styles.navModePopoverCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Estilo de Navegação</Text>
                  <Text style={styles.modalSubtitle}>
                    Port oficial do NavigationManager da Pizzaria TOP
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setNavPickerOpen(false)}
                >
                  <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {NAV_MODE_OPTIONS.map((opt) => {
                const selected = navStyle === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[
                      styles.navModeOption,
                      selected && {
                        backgroundColor: themeBg,
                        borderColor: themeColor,
                      },
                    ]}
                    onPress={() => {
                      setNavStyle(opt.mode);
                      setNavPickerOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rowGap, { flex: 1 }]}>
                      <Feather
                        name={opt.icon}
                        size={18}
                        color={selected ? themeColor : PIZZARIA_COLORS.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.navModeOptionTitle,
                            selected && { color: themeColor },
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.navModeOptionSub}>{opt.subtitle}</Text>
                      </View>
                    </View>
                    {selected ? (
                      <Feather name="check-circle" size={17} color={themeColor} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal do Garçom IA (SmartWaiter) */}
        <SmartWaiterModal visible={smartWaiterVisible} onClose={closeSmartWaiter} />
      </View>
    </SafeAreaView>
  );
}
