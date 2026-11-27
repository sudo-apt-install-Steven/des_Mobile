import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  Avaliacao,
  Combo,
  Cupom,
  Ingrediente,
  Sabor,
  extractErrorMessage,
  formatCurrency,
  getAvaliacoesTop,
  getCombos,
  getCupons,
  getIngredientes,
  getSabores,
  likeAvaliacao,
} from '../../services/pizzariatopApi';
import { useResponsive } from '../../hooks/useResponsive';
import {
  LOGO_PIZZARIATOP,
  getPizzaImageSource,
  normalizePizzaText,
} from '../../utils/pizzaImageMap';
import { AdminAuthBanner } from '../../components/pizzariatop/AdminAuthBanner';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { PizzaShowcaseCarousel } from '../../components/pizzariatop/PizzaShowcaseCarousel';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import {
  MESAS_DISPONIVEIS_LAYOUT,
  usePizzariaTop,
} from '../../components/pizzariatop/PizzariaTopContext';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const CRUD_PILLS: Array<{ method: string; bg: string; border: string; color: string }> = [
  {
    method: 'GET',
    bg: 'rgba(16, 185, 129, 0.18)',
    border: 'rgba(16, 185, 129, 0.42)',
    color: '#86EFAC',
  },
  {
    method: 'POST',
    bg: 'rgba(250, 204, 21, 0.18)',
    border: 'rgba(250, 204, 21, 0.44)',
    color: '#FDE68A',
  },
  {
    method: 'PUT',
    bg: 'rgba(59, 130, 246, 0.18)',
    border: 'rgba(59, 130, 246, 0.44)',
    color: '#93C5FD',
  },
  {
    method: 'DELETE',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.44)',
    color: '#FCA5A5',
  },
];

const FALLBACK_COMBOS: Combo[] = [
  {
    id_combo: 301,
    nome_combo: 'Combo Família Forno a Lenha',
    descricao: '1 Pizza Família (até 3 sabores) + 1 Pizza Broto Doce com borda artesanal.',
    preco_combo: 79.9,
    ativo: 1,
  },
  {
    id_combo: 302,
    nome_combo: 'Combo Casal Especial TOP',
    descricao: '1 Pizza Grande Meio a Meio + Pizza Média Chocolate com Morango.',
    preco_combo: 64.9,
    ativo: 1,
  },
];

export default function PizzariaTopInicioScreen() {
  const { width } = useResponsive();
  const {
    user,
    topCoins,
    isVip,
    cartCount,
    mesasOcupadas,
    openSmartWaiter,
    addToCart,
  } = usePizzariaTop();

  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);

  const [carregando, setCarregando] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);
  const [likingId, setLikingId] = useState<number | null>(null);

  const isWide = width >= 768;
  const isDesktopGrid = width >= 920;

  const carregarVitrine = useCallback(async (isPull = false) => {
    if (isPull) {
      setRefreshing(true);
    } else {
      setCarregando(true);
    }
    setErro('');

    try {
      const results = await Promise.allSettled([
        getSabores(false),
        getIngredientes(),
        getAvaliacoesTop(),
        getCombos(),
        getCupons(),
      ]);

      const [saboresRes, ingredientesRes, avalRes, combosRes, cuponsRes] = results;

      if (saboresRes.status === 'fulfilled') setSabores(saboresRes.value);
      if (ingredientesRes.status === 'fulfilled') setIngredientes(ingredientesRes.value);
      if (avalRes.status === 'fulfilled') setAvaliacoes(avalRes.value);
      if (combosRes.status === 'fulfilled') setCombos(combosRes.value);
      if (cuponsRes.status === 'fulfilled') setCupons(cuponsRes.value);

      const coreRejected =
        saboresRes.status === 'rejected' &&
        ingredientesRes.status === 'rejected' &&
        avalRes.status === 'rejected';

      if (coreRejected) {
        setErro(
          extractErrorMessage(
            saboresRes.reason,
            'Não foi possível conectar à API PizzariaTop.'
          )
        );
      }
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao carregar dados ao vivo da PizzariaTop.'));
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarVitrine();
  }, [carregarVitrine]);

  const firstName = user?.nome ? user.nome.trim().split(/\s+/)[0] : null;

  // Cupom promocional ativo fiel ao Inicial2 / page.js do site oficial
  const featuredCoupon = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = cupons.filter((c) => {
      if (c.ativo === 0 || c.ativo === false) return false;
      if (!c.data_validade) return true;
      const dt = new Date(c.data_validade);
      return Number.isNaN(dt.getTime()) || dt >= today;
    });
    if (active.length > 0) {
      const sorted = [...active].sort(
        (a, b) => Number(b.valor_desconto ?? 0) - Number(a.valor_desconto ?? 0)
      );
      const best = sorted[0];
      const val = Number(best.valor_desconto ?? 10);
      const isPercent = String(best.tipo_desconto || '').toLowerCase().includes('percent');
      return {
        codigo: best.codigo,
        label: isPercent ? `${val}% OFF` : `${formatCurrency(val)} OFF`,
      };
    }
    return { codigo: 'PIZZATOP10', label: '10% OFF' };
  }, [cupons]);

  // Combos filtrados (sem refrigerante/refri como no site oficial, com fallback elegante)
  const displayCombos = useMemo(() => {
    const filtered = combos.filter((c) => {
      const text = normalizePizzaText(`${c.nome_combo ?? c.nome ?? ''} ${c.descricao ?? ''}`);
      return !text.includes('refrigerante') && !text.includes('refri');
    });
    return filtered.length > 0 ? filtered : combos.length > 0 ? combos : FALLBACK_COMBOS;
  }, [combos]);

  const mesasLivresCount = Math.max(
    0,
    MESAS_DISPONIVEIS_LAYOUT.length - mesasOcupadas.length
  );

  const ecosystemCards = useMemo(
    () => [
      {
        key: 'montar',
        title: 'Montar Pizza',
        subtitle: 'Tamanhos, Massas, Bordas & POST /calculate',
        badge: 'Passo a passo',
        icon: 'pie-chart' as const,
        accent: '#FF8C42',
        route: '/Atividade15_PizzariaTop/montar',
      },
      {
        key: 'reservas',
        title: 'Reserva de Mesas',
        subtitle: 'Salão Forno a Lenha, Varanda & Área VIP',
        badge: `${mesasLivresCount} de ${MESAS_DISPONIVEIS_LAYOUT.length} mesas livres`,
        icon: 'calendar' as const,
        accent: '#10B981',
        route: '/Atividade15_PizzariaTop/reservas',
      },
      {
        key: 'avaliacoes',
        title: 'Mural de Avaliações',
        subtitle: 'Clientes verificados, fotos & curtidas ao vivo',
        badge: `${Math.max(avaliacoes.length, 5)}+ destaques`,
        icon: 'star' as const,
        accent: '#FACC15',
        route: '/Atividade15_PizzariaTop/avaliacoes',
      },
      {
        key: 'clube_admin',
        title: 'Clube VIP & Painel KDS',
        subtitle: 'Assinatura Premium, TopCoins, Stats & Cozinha',
        badge: isVip ? '⭐ VIP Ativo' : `⚡ ${topCoins} TopCoins`,
        icon: 'award' as const,
        accent: '#8B5CF6',
        route: '/Atividade15_PizzariaTop/clube_admin',
      },
      {
        key: 'pedidos',
        title: 'Carrinho & Rastreio',
        subtitle: 'ViaCEP, Cupom, Pagamento & GPS Tracking',
        badge: cartCount > 0 ? `${cartCount} no carrinho` : 'Status 5 etapas',
        icon: 'shopping-bag' as const,
        accent: '#38BDF8',
        route: '/Atividade15_PizzariaTop/pedidos',
      },
      {
        key: 'api_map',
        title: 'API Explorer (63+ rotas)',
        subtitle: 'Catálogo REST completo & Testador GET Axios',
        badge: 'Live Inspector',
        icon: 'terminal' as const,
        accent: '#F59E0B',
        route: '/Atividade15_PizzariaTop/api_map',
      },
    ],
    [mesasLivresCount, avaliacoes.length, isVip, topCoins, cartCount]
  );

  const handleLikeAvaliacao = async (item: Avaliacao) => {
    const id = item.id_pedido ?? item.id;
    if (!id || likingId === id) return;
    setLikingId(id);
    try {
      await likeAvaliacao(id);
      setAvaliacoes((prev) =>
        prev.map((av) =>
          (av.id_pedido ?? av.id) === id
            ? { ...av, likes_avaliacao: Number(av.likes_avaliacao ?? 0) + 1 }
            : av
        )
      );
      setFeedback({
        type: 'success',
        message: `Curtida registrada na avaliação do pedido #${id}!`,
      });
    } catch (e) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(e, 'Não foi possível curtir a avaliação.'),
      });
    } finally {
      setLikingId(null);
    }
  };

  const handleAddCombo = (combo: Combo) => {
    const nome = combo.nome_combo || combo.nome || 'Combo Especial TOP';
    const preco = Number(combo.preco_combo ?? combo.preco ?? 64.9);
    addToCart({
      id_produto: Number(combo.id_combo ?? combo.id ?? 301),
      tipo_item: 'combo',
      nome,
      detalhes: combo.descricao || 'Combo Promocional Pizzaria TOP',
      quantidade: 1,
      preco_unitario: Number.isNaN(preco) || preco <= 0 ? 64.9 : preco,
    });
    setFeedback({
      type: 'success',
      message: `"${nome}" adicionado ao carrinho! Finalize na aba Pedidos.`,
    });
  };

  const gridCardWidth = isDesktopGrid
    ? ('32%' as const)
    : width >= 560
    ? ('48.6%' as const)
    : ('48.2%' as const);

  return (
    <PizzariaTopShell activeTab="inicio" subtitle="Forno a Lenha · Ecossistema Oficial + CRUD">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => carregarVitrine(true)}
            tintColor={PIZZARIA_COLORS.gold}
            colors={[PIZZARIA_COLORS.fireOrange]}
          />
        }
      >
        <View style={styles.maxWidthWrap}>
          {/* 1. HERO LARANJA VIBRANTE PIZZARIA TOP (fiel ao Inicial2 + page.js) */}
          <View style={homeStyles.orangeHeroCard}>
            <View style={homeStyles.heroWarmOrbLeft} />
            <View style={homeStyles.heroWarmOrbRight} />

            {/* Fita / Selo de Cupom Promocional Ativo */}
            <View style={homeStyles.heroTopBar}>
              <View style={homeStyles.heroSincePill}>
                <FontAwesome5 name="pizza-slice" size={11} color="#FEF08A" />
                <Text style={homeStyles.heroSinceText}>
                  {firstName ? `Olá, ${firstName}! 👋` : 'Pizzaria TOP · Desde 1987'}
                </Text>
              </View>

              <TouchableOpacity
                style={homeStyles.couponRibbon}
                onPress={() =>
                  setFeedback({
                    type: 'info',
                    message: `✨ Psiu! Use o cupom "${featuredCoupon.codigo}" (${featuredCoupon.label}) na tela de Pedidos!`,
                  })
                }
                activeOpacity={0.85}
              >
                <Feather name="tag" size={12} color="#111827" />
                <Text style={homeStyles.couponRibbonText}>
                  CUPOM: {featuredCoupon.codigo} · {featuredCoupon.label}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Centro do Hero: Emblema Circular Duplo + Título + CTAs */}
            <View style={[homeStyles.heroMainRow, isWide && homeStyles.heroMainRowWide]}>
              <View style={homeStyles.doubleLogoRingOuter}>
                <View style={homeStyles.doubleLogoRingInner}>
                  <Image
                    source={LOGO_PIZZARIATOP}
                    style={homeStyles.heroLogoImg}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={[homeStyles.heroTextBlock, isWide && { alignItems: 'flex-start', flex: 1 }]}>
                <Text style={[homeStyles.heroHeadline, !isWide && { textAlign: 'center' }]}>
                  Pizzaria TOP
                </Text>
                <Text style={[homeStyles.heroSubheadline, !isWide && { textAlign: 'center' }]}>
                  Sua pizza favorita está aqui! Cardápio artesanal ao vivo integrado à API REST
                  oficial com Axios, Garçom IA e gestão CRUD completa.
                </Text>

                <View
                  style={[
                    homeStyles.heroCtasWrap,
                    !isWide && { justifyContent: 'center' },
                  ]}
                >
                  <TouchableOpacity
                    style={homeStyles.ctaMontarAgora}
                    onPress={() => router.push('/Atividade15_PizzariaTop/montar')}
                    activeOpacity={0.85}
                  >
                    <Text style={homeStyles.ctaMontarAgoraText}>🍕 Montar Agora!</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={homeStyles.ctaGarcomIa}
                    onPress={openSmartWaiter}
                    activeOpacity={0.85}
                  >
                    <Feather name="message-circle" size={15} color="#FEF08A" />
                    <Text style={homeStyles.ctaGarcomIaText}>✨ Falar com Garçom IA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* 2. Autenticação Admin Bearer + FeedbackBanner */}
          <AdminAuthBanner onAuthChange={() => carregarVitrine(true)} />

          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {erro !== '' ? (
            <View style={styles.errorCard}>
              <Feather name="wifi-off" size={24} color="#FCA5A5" style={{ marginBottom: 8 }} />
              <Text style={styles.errorText}>{erro}</Text>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={() => carregarVitrine(false)}
                activeOpacity={0.85}
              >
                <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                <Text style={styles.primaryCtaText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* 3. Carrossel Showcase Oficial (PizzaShowcaseCarousel) */}
          <PizzaShowcaseCarousel
            sabores={sabores}
            loading={carregando}
            onAddedToCart={(saborNome, tamanhoLabel) =>
              setFeedback({
                type: 'success',
                message: `Pizza ${saborNome} (${tamanhoLabel}) adicionada ao carrinho!`,
              })
            }
          />

          {/* 4. SEÇÃO DESTAQUE — AS 2 TELAS CRUD OBRIGATÓRIAS (Axios + Expo Router) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>2 Telas CRUD Obrigatórias (Axios)</Text>
            </View>
            <Text style={styles.sectionMeta}>GET · POST · PUT · DELETE</Text>
          </View>

          <View style={[homeStyles.crudDualRow, isWide && { flexDirection: 'row' }]}>
            {/* Tela 1: Sabores de Pizza (/api/sabores) */}
            <TouchableOpacity
              style={[
                styles.crudCard,
                homeStyles.crudFeatureCard,
                { borderColor: PIZZARIA_COLORS.fireBorder },
                isWide && { flex: 1, marginBottom: 0 },
              ]}
              onPress={() => router.push('/Atividade15_PizzariaTop/sabores')}
              activeOpacity={0.86}
            >
              <View style={styles.crudCardHeader}>
                <View style={[styles.rowGap, { flex: 1 }]}>
                  <View style={homeStyles.crudThumbStack}>
                    <Image
                      source={getPizzaImageSource(
                        sabores[0]?.nome_sabor || 'Calabresa',
                        sabores[0]?.imagem_url
                      )}
                      style={homeStyles.crudThumbImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={homeStyles.crudScreenKicker}>TELA 1 · RECURSO PRINCIPAL</Text>
                    <Text style={styles.itemTitle}>Sabores de Pizza</Text>
                    <Text style={styles.itemDesc}>Endpoint: /api/sabores</Text>
                  </View>
                </View>

                <View style={styles.crudCountBadge}>
                  <Text style={styles.crudCountText}>
                    {carregando ? '...' : `${sabores.length} sabores`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.itemDesc, { marginBottom: 8 }]}>
                Listagem ao vivo, consulta individual GET /:id, cadastro de novos sabores, edição
                e exclusão com confirmação.
              </Text>

              {/* Miniaturas reais dos sabores */}
              <View style={[styles.rowGap, { gap: 6, marginBottom: 8 }]}>
                {(sabores.length > 0
                  ? sabores.slice(0, 4).map((s) => s.nome_sabor)
                  : ['Calabresa', '4 Queijos', 'Frango', 'Chocolate']
                ).map((sName, idx) => (
                  <View key={`mini-sab-${idx}`} style={homeStyles.miniAvatarCircle}>
                    <Image
                      source={getPizzaImageSource(sName)}
                      style={styles.menuThumbImg}
                      resizeMode="cover"
                    />
                  </View>
                ))}
                <Text style={[styles.sectionMeta, { marginLeft: 4 }]}>
                  Tradicional · Especial · Premium · Doce
                </Text>
              </View>

              <View style={styles.httpPillRow}>
                {CRUD_PILLS.map((pill) => (
                  <View
                    key={`sab-${pill.method}`}
                    style={[
                      styles.httpPill,
                      { backgroundColor: pill.bg, borderColor: pill.border },
                    ]}
                  >
                    <Text style={[styles.httpPillText, { color: pill.color }]}>{pill.method}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.crudCardFooter}>
                <Text style={styles.couponMetaText}>Gerenciar Sabores (/api/sabores)</Text>
                <Feather name="arrow-right" size={16} color={PIZZARIA_COLORS.gold} />
              </View>
            </TouchableOpacity>

            {/* Tela 2: Ingredientes & Adicionais (/api/ingredientes) */}
            <TouchableOpacity
              style={[
                styles.crudCard,
                homeStyles.crudFeatureCard,
                { borderColor: PIZZARIA_COLORS.goldBorder },
                isWide && { flex: 1, marginBottom: 0 },
              ]}
              onPress={() => router.push('/Atividade15_PizzariaTop/ingredientes')}
              activeOpacity={0.86}
            >
              <View style={styles.crudCardHeader}>
                <View style={[styles.rowGap, { flex: 1 }]}>
                  <View
                    style={[
                      homeStyles.crudThumbStack,
                      { borderColor: PIZZARIA_COLORS.goldBorder },
                    ]}
                  >
                    <Image
                      source={getPizzaImageSource('Quatro Queijos')}
                      style={homeStyles.crudThumbImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[homeStyles.crudScreenKicker, { color: PIZZARIA_COLORS.gold }]}>
                      TELA 2 · INSUMOS & ADICIONAIS
                    </Text>
                    <Text style={styles.itemTitle}>Ingredientes & Adicionais</Text>
                    <Text style={styles.itemDesc}>Endpoint: /api/ingredientes</Text>
                  </View>
                </View>

                <View style={styles.crudCountBadge}>
                  <Text style={styles.crudCountText}>
                    {carregando ? '...' : `${ingredientes.length} itens`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.itemDesc, { marginBottom: 8 }]}>
                Controle completo de estoque, preços adicionais e disponibilidade por tipo de
                ingrediente na API REST.
              </Text>

              <View style={[styles.rowGap, { flexWrap: 'wrap', gap: 6, marginBottom: 8 }]}>
                {['Queijos', 'Carnes', 'Vegetais', 'Doces', 'Frutas'].map((tipo) => (
                  <View key={tipo} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{tipo}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.httpPillRow}>
                {CRUD_PILLS.map((pill) => (
                  <View
                    key={`ing-${pill.method}`}
                    style={[
                      styles.httpPill,
                      { backgroundColor: pill.bg, borderColor: pill.border },
                    ]}
                  >
                    <Text style={[styles.httpPillText, { color: pill.color }]}>{pill.method}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.crudCardFooter}>
                <Text style={styles.couponMetaText}>
                  Gerenciar Ingredientes (/api/ingredientes)
                </Text>
                <Feather name="arrow-right" size={16} color={PIZZARIA_COLORS.gold} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 5. GRID ECOSSISTEMA COMPLETO DO SITE PIZZARIATOP */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.violet }]} />
              <Text style={styles.sectionTitle}>Ecossistema Completo do Site PizzariaTop</Text>
            </View>
            <Text style={styles.sectionMeta}>6 Módulos</Text>
          </View>

          <View style={homeStyles.ecosystemGrid}>
            {ecosystemCards.map((card) => (
              <TouchableOpacity
                key={card.key}
                style={[homeStyles.ecoCard, { width: gridCardWidth }]}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.84}
              >
                <View style={homeStyles.ecoTopRow}>
                  <View
                    style={[
                      homeStyles.ecoIconBox,
                      { backgroundColor: `${card.accent}22`, borderColor: `${card.accent}66` },
                    ]}
                  >
                    <Feather name={card.icon} size={17} color={card.accent} />
                  </View>
                  <Feather name="arrow-up-right" size={15} color={PIZZARIA_COLORS.textMuted} />
                </View>

                <Text style={homeStyles.ecoTitle} numberOfLines={1}>
                  {card.title}
                </Text>
                <Text style={homeStyles.ecoSub} numberOfLines={2}>
                  {card.subtitle}
                </Text>

                <View
                  style={[
                    homeStyles.ecoBadgePill,
                    { borderColor: `${card.accent}55`, backgroundColor: `${card.accent}18` },
                  ]}
                >
                  <Text style={[homeStyles.ecoBadgeText, { color: card.accent }]} numberOfLines={1}>
                    {card.badge}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 6. COMBOS ESPECIAIS (GET /combos) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.fireOrange }]} />
              <Text style={styles.sectionTitle}>Combos Especiais</Text>
            </View>
            <Text style={styles.sectionMeta}>Ofertas do Forno</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            style={{ marginBottom: 14 }}
          >
            {displayCombos.map((combo, idx) => {
              const nome = combo.nome_combo || combo.nome || `Combo TOP #${idx + 1}`;
              const preco = Number(combo.preco_combo ?? combo.preco ?? 64.9);
              return (
                <View
                  key={`combo-${combo.id_combo ?? combo.id ?? idx}`}
                  style={[styles.comboCard, { width: 268 }]}
                >
                  <View style={[styles.menuItemRow, { marginBottom: 10 }]}>
                    <View style={[styles.menuThumb, { width: 58, height: 58 }]}>
                      <Image
                        source={getPizzaImageSource(nome, combo.imagem_url)}
                        style={styles.menuThumbImg}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: PIZZARIA_COLORS.gold }]} numberOfLines={2}>
                        {nome}
                      </Text>
                      <Text style={styles.priceText}>
                        {formatCurrency(Number.isNaN(preco) || preco <= 0 ? 64.9 : preco)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.itemDesc, { marginBottom: 12 }]} numberOfLines={2}>
                    {combo.descricao || 'Combinação artesanal especial preparada na hora.'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.goldCtaBtn, { paddingVertical: 9 }]}
                    onPress={() => handleAddCombo(combo)}
                    activeOpacity={0.85}
                  >
                    <Feather name="shopping-cart" size={14} color="#111827" />
                    <Text style={[styles.goldCtaText, { fontSize: 12.5 }]}>
                      Adicionar Combo
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* 7. TOP AVALIAÇÕES VERIFICADAS (GET /avaliacoes/top + curtir) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.emerald }]} />
              <Text style={styles.sectionTitle}>Top Avaliações Verificadas</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/Atividade15_PizzariaTop/avaliacoes')}
              activeOpacity={0.8}
            >
              <Text style={styles.couponMetaText}>Ver mural completo →</Text>
            </TouchableOpacity>
          </View>

          {carregando && avaliacoes.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
              <Text style={[styles.itemDesc, { marginTop: 8 }]}>
                Carregando avaliações verificadas...
              </Text>
            </View>
          ) : avaliacoes.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>
                Nenhuma avaliação em destaque no momento. Visite o Mural de Avaliações para enviar
                a sua!
              </Text>
            </View>
          ) : (
            avaliacoes.slice(0, 4).map((av, idx) => {
              const avId = av.id_pedido ?? av.id ?? idx;
              const rating = Math.max(1, Math.min(5, Number(av.avaliacao ?? 5)));
              const clientName = av.nome_cliente ?? av.nome ?? 'Cliente Pizzaria TOP';
              return (
                <View key={`av-home-${avId}`} style={styles.glassCard}>
                  <View style={styles.reviewHeaderRow}>
                    <View style={[styles.rowGap, { flex: 1 }]}>
                      <View style={homeStyles.reviewerAvatar}>
                        <Text style={homeStyles.reviewerAvatarText}>
                          {clientName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {clientName}
                        </Text>
                        <View style={[styles.rowGap, { gap: 5 }]}>
                          <Feather name="check-circle" size={11} color={PIZZARIA_COLORS.emerald} />
                          <Text style={{ color: '#86EFAC', fontSize: 11, fontWeight: '700' }}>
                            Compra Verificada · Pedido #{avId}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.starsRow}>
                      {Array.from({ length: rating }).map((_, sIdx) => (
                        <FontAwesome5
                          key={`star-${avId}-${sIdx}`}
                          name="star"
                          solid
                          size={12}
                          color={PIZZARIA_COLORS.gold}
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.itemDesc, { marginBottom: 10, color: '#E5E7EB' }]}>
                    &ldquo;{av.comentario_avaliacao ?? av.comentario ?? 'Pizza sensacional e quentinha!'}&rdquo;
                  </Text>

                  <View style={[styles.rowGap, { justifyContent: 'flex-end' }]}>
                    <TouchableOpacity
                      style={styles.likeBtn}
                      onPress={() => handleLikeAvaliacao(av)}
                      disabled={likingId === avId}
                      activeOpacity={0.75}
                    >
                      <FontAwesome5 name="heart" solid size={11} color="#FCA5A5" />
                      <Text style={styles.likeBtnText}>
                        {Number(av.likes_avaliacao ?? 0)} curtida(s)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* 8. RODAPÉ OFICIAL PIZZARIA TOP */}
          <View style={homeStyles.officialFooter}>
            <View style={[styles.rowGap, { justifyContent: 'center', marginBottom: 8 }]}>
              <Image
                source={LOGO_PIZZARIATOP}
                style={{ width: 34, height: 34, borderRadius: 17 }}
                resizeMode="contain"
              />
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
                  Pizzaria TOP
                </Text>
                <Text style={{ color: PIZZARIA_COLORS.gold, fontSize: 11, fontWeight: '700' }}>
                  Forno a Lenha · Delivery & Salão
                </Text>
              </View>
            </View>

            <Text style={homeStyles.footerInfoText}>
              Seg a Dom | 18h às 23h · Aceitamos Pix • Débito • Crédito
            </Text>
            <Text style={homeStyles.footerInfoText}>
              (69) 99620-4151 · pizzariatop@gmail.com
            </Text>
            <View style={homeStyles.footerVersionPill}>
              <Text style={homeStyles.footerVersionText}>
                Pizzaria TOP Mobile · Versão 4.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}

const homeStyles = StyleSheet.create({
  orangeHeroCard: {
    borderRadius: 26,
    backgroundColor: '#E04F26',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.55)',
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroWarmOrbLeft: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF8C42',
    opacity: 0.55,
  },
  heroWarmOrbRight: {
    position: 'absolute',
    bottom: -70,
    right: -40,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#B91C1C',
    opacity: 0.45,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  heroSincePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroSinceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  couponRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FACC15',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  couponRibbonText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroMainRow: {
    alignItems: 'center',
    gap: 16,
  },
  heroMainRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  doubleLogoRingOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleLogoRingInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    borderWidth: 2,
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLogoImg: {
    width: 84,
    height: 84,
  },
  heroTextBlock: {
    alignItems: 'center',
    width: '100%',
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  heroSubheadline: {
    color: '#FFF7ED',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroCtasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ctaMontarAgora: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaMontarAgoraText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  ctaGarcomIa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaGarcomIaText: {
    color: '#FEF08A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  crudDualRow: {
    gap: 12,
    marginBottom: 14,
  },
  crudFeatureCard: {
    borderWidth: 1.5,
  },
  crudThumbStack: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.fireBorder,
    backgroundColor: PIZZARIA_COLORS.bgElevated,
  },
  crudThumbImg: {
    width: '100%',
    height: '100%',
  },
  crudScreenKicker: {
    color: '#FDBA74',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  miniAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
    backgroundColor: PIZZARIA_COLORS.bgElevated,
  },
  ecosystemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 14,
  },
  ecoCard: {
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    padding: 14,
    justifyContent: 'space-between',
  },
  ecoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ecoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoTitle: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  ecoSub: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  ecoBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  ecoBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 14,
    fontWeight: '900',
  },
  officialFooter: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerInfoText: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerVersionPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
  },
  footerVersionText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
  },
});
