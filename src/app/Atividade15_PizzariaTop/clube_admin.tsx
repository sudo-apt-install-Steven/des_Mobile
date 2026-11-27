import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  Pedido,
  Recompensa,
  StatsChartPoint,
  StatsSummary,
  extractErrorMessage,
  formatCurrency,
  getPedidos,
  getRecompensas,
  getStats,
  getStatsChart,
  resgatarRecompensa,
  updatePedidoStatus,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { AdminAuthBanner } from '../../components/pizzariatop/AdminAuthBanner';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { createShadow, useResponsive } from '../../hooks/useResponsive';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

type TopSegmentTab = 'vip' | 'admin';
type KdsColumnKey = 'pendentes' | 'em_preparo' | 'saiu_entregue';

const VIP_BENEFITS = [
  'Frete Grátis em TODOS os pedidos',
  '+20% de TopCoins',
  'Brinde Surpresa no Aniversário',
  'Prioridade na Fila da Cozinha',
] as const;

const KDS_COLUMNS: Array<{
  key: KdsColumnKey;
  label: string;
  color: string;
  bgTint: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  {
    key: 'pendentes',
    label: 'Pendentes',
    color: '#FACC15',
    bgTint: 'rgba(250, 204, 21, 0.16)',
    icon: 'clock',
  },
  {
    key: 'em_preparo',
    label: 'Em Preparo',
    color: '#FF6B35',
    bgTint: 'rgba(255, 107, 53, 0.18)',
    icon: 'zap',
  },
  {
    key: 'saiu_entregue',
    label: 'Saiu / Entregue',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.16)',
    icon: 'truck',
  },
];

function normalizeStatus(status?: string | null): string {
  return String(status ?? 'pendente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function classifyKdsOrder(status?: string | null): KdsColumnKey {
  const s = normalizeStatus(status);
  if (s.includes('prepar') || s.includes('forno') || s.includes('cozinha')) {
    return 'em_preparo';
  }
  if (
    s.includes('saiu') ||
    s.includes('entreg') ||
    s.includes('rota') ||
    s.includes('conclu') ||
    s.includes('finaliz')
  ) {
    return 'saiu_entregue';
  }
  return 'pendentes';
}

function isOrderDelivered(status?: string | null): boolean {
  const s = normalizeStatus(status);
  return s === 'entregue' || s.includes('conclu') || s.includes('finaliz');
}

function formatChartDayLabel(pt: StatsChartPoint, index: number): string {
  const raw = pt.dia ?? pt.label ?? pt.data ?? '';
  if (!raw) return `D-${6 - index}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [, mm, dd] = raw.split('T')[0].split('-');
    return `${dd}/${mm}`;
  }
  return String(raw).slice(0, 6);
}

function getChartPointValue(pt: StatsChartPoint): number {
  const raw =
    pt.valor ??
    pt.faturamento ??
    pt.total ??
    (pt as Record<string, unknown>).receita ??
    pt.pedidos ??
    0;
  const num = Number(raw);
  return Number.isNaN(num) ? 0 : num;
}

function buildFallbackChartFromPedidos(pedidos: Pedido[]): StatsChartPoint[] {
  const days: Array<{ key: string; label: string; total: number }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      key: `${yyyy}-${mm}-${dd}`,
      label: `${dd}/${mm}`,
      total: 0,
    });
  }
  pedidos.forEach((p) => {
    if (!p.data_pedido) return;
    const d = new Date(p.data_pedido);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const bucket = days.find((item) => item.key === key);
    if (bucket) {
      const val = Number(p.valor_total ?? 0);
      if (!Number.isNaN(val)) bucket.total += val;
    }
  });
  return days.map((d) => ({ label: d.label, valor: Number(d.total.toFixed(2)) }));
}

export default function ClubeAdminScreen() {
  const { width } = useResponsive();
  const { user, topCoins, setTopCoins, isVip, setIsVip } = usePizzariaTop();

  const roleLower = String(user?.tipo_usuario ?? '').toLowerCase();
  const isStaff =
    Boolean(user) &&
    (roleLower === 'admin' || roleLower === 'funcionario' || roleLower === 'gerente');

  const [activeSegment, setActiveSegment] = useState<TopSegmentTab>(
    isStaff ? 'admin' : 'vip'
  );
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(
    null
  );

  // Estado Aba 1: Clube VIP & Recompensas
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loadingVip, setLoadingVip] = useState<boolean>(true);
  const [activatingVip, setActivatingVip] = useState<boolean>(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  // Estado Aba 2: Painel Staff/Admin & KDS Cozinha
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [chartPoints, setChartPoints] = useState<StatsChartPoint[]>([]);
  const [chartFromApi, setChartFromApi] = useState<boolean>(false);
  const [pedidosKds, setPedidosKds] = useState<Pedido[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [kdsColumn, setKdsColumn] = useState<KdsColumnKey>('pendentes');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const carregarRecompensas = useCallback(async () => {
    setLoadingVip(true);
    try {
      const lista = await getRecompensas();
      setRecompensas(lista);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Erro ao carregar recompensas do Clube TOP.'),
      });
    } finally {
      setLoadingVip(false);
    }
  }, []);

  const carregarPainelAdmin = useCallback(async () => {
    setLoadingAdmin(true);
    try {
      const [statsRes, chartRes, pedidosRes] = await Promise.allSettled([
        getStats(),
        getStatsChart(),
        getPedidos(),
      ]);

      const loadedPedidos =
        pedidosRes.status === 'fulfilled' ? pedidosRes.value : [];
      setPedidosKds(loadedPedidos);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }

      if (chartRes.status === 'fulfilled' && chartRes.value.length > 0) {
        setChartPoints(chartRes.value.slice(-7));
        setChartFromApi(true);
      } else {
        setChartPoints(buildFallbackChartFromPedidos(loadedPedidos));
        setChartFromApi(false);
      }
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    carregarRecompensas();
    carregarPainelAdmin();
  }, [carregarRecompensas, carregarPainelAdmin]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([carregarRecompensas(), carregarPainelAdmin()]);
    setRefreshing(false);
  };

  // Ações Aba 1: VIP & Recompensas
  const handleAtivarVip = () => {
    setActivatingVip(true);
    setTimeout(() => {
      setIsVip(true);
      setActivatingVip(false);
      setFeedback({
        type: 'success',
        message:
          '⭐ Assinatura Clube TOP Premium ativada! Frete grátis, +20% de TopCoins e prioridade na cozinha liberados.',
      });
    }, 350);
  };

  const handleResgatar = async (rec: Recompensa) => {
    const id = Number(rec.id_recompensa ?? rec.id ?? 0);
    if (!id) return;
    if (!user) {
      setFeedback({
        type: 'info',
        message: 'Faça login na aba Perfil (ou no topo) para resgatar recompensas com TopCoins.',
      });
      return;
    }

    const custo = Number(rec.pontos_necessarios ?? rec.custo_pontos ?? 0);
    setRedeemingId(id);
    setFeedback(null);
    try {
      await resgatarRecompensa(id);
      if (custo > 0) {
        setTopCoins(Math.max(0, topCoins - custo));
      }
      setFeedback({
        type: 'success',
        message: `🎁 Recompensa "${rec.nome ?? rec.titulo}" resgatada com sucesso!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Não foi possível resgatar esta recompensa.'),
      });
    } finally {
      setRedeemingId(null);
    }
  };

  // Ações Aba 2: KDS 1-clique
  const handleAdvanceOrderStatus = async (pedido: Pedido, nextStatus: string) => {
    const id = Number(pedido.id_pedido ?? pedido.id ?? 0);
    if (!id) return;

    setUpdatingOrderId(id);
    setFeedback(null);
    try {
      await updatePedidoStatus(id, { status_pedido: nextStatus });
      setPedidosKds((prev) =>
        prev.map((item) => {
          const itemId = Number(item.id_pedido ?? item.id ?? 0);
          return itemId === id ? { ...item, status_pedido: nextStatus } : item;
        })
      );
      const nextCol = classifyKdsOrder(nextStatus);
      setKdsColumn(nextCol);
      setFeedback({
        type: 'success',
        message: `Pedido #${id} atualizado para "${nextStatus}" no KDS da Cozinha!`,
      });
      getStats()
        .then((s) => setStats(s))
        .catch(() => {});
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(
          err,
          `Falha ao atualizar o status do Pedido #${id}.`
        ),
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // KPIs extraídos de getStats()
  const adminKpis = useMemo(() => {
    const rawFat =
      stats?.faturamento_total ??
      stats?.faturamentoTotal ??
      stats?.receita_total ??
      (stats as Record<string, unknown> | null)?.faturamento ??
      0;
    const rawHoje =
      stats?.pedidos_hoje ??
      stats?.pedidosHoje ??
      stats?.total_pedidos ??
      pedidosKds.length;
    const rawClientes =
      stats?.clientes_totais ??
      stats?.clientesTotais ??
      stats?.total_clientes ??
      0;

    return {
      faturamento: formatCurrency(rawFat as number | string),
      pedidosHoje: Number(rawHoje ?? 0),
      clientesTotais: Number(rawClientes ?? 0),
      topSabores: Array.isArray(stats?.top_sabores) ? stats!.top_sabores! : [],
    };
  }, [stats, pedidosKds.length]);

  // Escala do gráfico de 7 dias
  const chartData = useMemo(() => {
    const pts = chartPoints.slice(-7);
    const values = pts.map(getChartPointValue);
    const maxVal = Math.max(...values, 1);
    return pts.map((pt, idx) => {
      const value = values[idx];
      const heightPct = Math.max(8, Math.round((value / maxVal) * 100));
      return {
        key: `bar-${idx}`,
        label: formatChartDayLabel(pt, idx),
        value,
        heightPct,
      };
    });
  }, [chartPoints]);

  // Agrupamento KDS
  const kdsCounts = useMemo(() => {
    const counts: Record<KdsColumnKey, number> = {
      pendentes: 0,
      em_preparo: 0,
      saiu_entregue: 0,
    };
    pedidosKds.forEach((p) => {
      counts[classifyKdsOrder(p.status_pedido)] += 1;
    });
    return counts;
  }, [pedidosKds]);

  const pedidosFiltradosKds = useMemo(
    () => pedidosKds.filter((p) => classifyKdsOrder(p.status_pedido) === kdsColumn),
    [pedidosKds, kdsColumn]
  );

  const vipProgressPct = Math.min(100, Math.round((topCoins / 150) * 100));
  const isWide = width >= 768;

  return (
    <PizzariaTopShell
      activeTab="clube_admin"
      subtitle="Clube VIP, Recompensas & Gestão KDS"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor="#FACC15"
            colors={['#FACC15']}
          />
        }
      >
        <View style={styles.maxWidthWrap}>
          {/* Segmented Switch no Topo (2 Abas Ricas) */}
          <View style={localStyles.segmentedContainer}>
            <TouchableOpacity
              style={[
                localStyles.segmentTab,
                activeSegment === 'vip' && localStyles.segmentTabVipActive,
              ]}
              onPress={() => setActiveSegment('vip')}
              activeOpacity={0.85}
            >
              <Feather
                name="award"
                size={15}
                color={activeSegment === 'vip' ? '#111827' : '#FACC15'}
              />
              <Text
                style={[
                  localStyles.segmentTabText,
                  activeSegment === 'vip' && localStyles.segmentTabTextDark,
                ]}
                numberOfLines={1}
              >
                ⭐ Clube TOP Premium & Recompensas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.segmentTab,
                activeSegment === 'admin' && localStyles.segmentTabAdminActive,
              ]}
              onPress={() => setActiveSegment('admin')}
              activeOpacity={0.85}
            >
              <Feather
                name="bar-chart-2"
                size={15}
                color={activeSegment === 'admin' ? '#FFFFFF' : '#C4B5FD'}
              />
              <Text
                style={[
                  localStyles.segmentTabText,
                  activeSegment === 'admin' && localStyles.segmentTabTextLight,
                ]}
                numberOfLines={1}
              >
                📊 Painel Staff/Admin & KDS Cozinha
              </Text>
            </TouchableOpacity>
          </View>

          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* ============================================================
              ABA 1: ⭐ CLUBE TOP PREMIUM & RECOMPENSAS
             ============================================================ */}
          {activeSegment === 'vip' ? (
            <View>
              {/* Card VIP Indigo / Gold fiel ao /premium */}
              <View style={localStyles.vipCard}>
                <View style={localStyles.vipOrbTop} />
                <View style={localStyles.vipOrbBottom} />

                <View style={localStyles.vipTopRow}>
                  <View style={localStyles.vipCrownPill}>
                    <Feather name="star" size={12} color="#FACC15" />
                    <Text style={localStyles.vipCrownPillText}>⭐ CLUBE VIP OFICIAL</Text>
                  </View>

                  {isVip ? (
                    <View style={localStyles.vipActiveSeal}>
                      <Feather name="check-circle" size={12} color="#10B981" />
                      <Text style={localStyles.vipActiveSealText}>MEMBRO VIP ATIVO</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={localStyles.vipTitle}>Pizza TOP Premium</Text>
                <Text style={localStyles.vipSubtitle}>
                  Experiência gastronômica prioritária para apaixonados por pizza artesanal.
                </Text>

                <View style={localStyles.vipPriceBox}>
                  <Text style={localStyles.vipPriceMain}>R$ 39,90</Text>
                  <Text style={localStyles.vipPricePeriod}> /mês</Text>
                </View>

                {/* 4 Benefícios Oficiais */}
                <View style={localStyles.benefitsList}>
                  {VIP_BENEFITS.map((beneficio) => (
                    <View key={beneficio} style={localStyles.benefitRow}>
                      <View style={localStyles.benefitIconWrap}>
                        <Feather name="check-circle" size={16} color="#10B981" />
                      </View>
                      <Text style={localStyles.benefitText}>{beneficio}</Text>
                    </View>
                  ))}
                </View>

                <View style={localStyles.vipActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.goldCtaBtn,
                      { flex: 1 },
                      isVip && { backgroundColor: '#10B981' },
                    ]}
                    onPress={handleAtivarVip}
                    disabled={activatingVip}
                    activeOpacity={0.85}
                  >
                    {activatingVip ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <>
                        <Feather
                          name={isVip ? 'check-circle' : 'zap'}
                          size={16}
                          color={isVip ? '#FFFFFF' : '#111827'}
                        />
                        <Text
                          style={[
                            styles.goldCtaText,
                            isVip && { color: '#FFFFFF' },
                          ]}
                        >
                          {isVip ? '✓ Assinatura VIP Ativa' : '⚡ Assinar / Ativar VIP'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {isVip && topCoins < 150 ? (
                    <TouchableOpacity
                      style={styles.ghostBtn}
                      onPress={() => {
                        setIsVip(false);
                        setFeedback({
                          type: 'info',
                          message: 'Assinatura simulada pausada.',
                        });
                      }}
                    >
                      <Text style={styles.ghostBtnText}>Pausar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Card Saldo TopCoins & Progresso */}
              <View style={[styles.glassCard, styles.glassCardGold]}>
                <View
                  style={[
                    styles.rowGap,
                    { justifyContent: 'space-between', marginBottom: 10 },
                  ]}
                >
                  <View style={styles.rowGap}>
                    <View style={localStyles.coinIconCircle}>
                      <Feather name="zap" size={18} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.itemDesc}>Seu Saldo de Fidelidade</Text>
                      <Text style={localStyles.coinsBigValue}>{topCoins} TopCoins</Text>
                    </View>
                  </View>

                  <View style={styles.tagPill}>
                    <Text style={[styles.tagPillText, { color: '#FACC15' }]}>
                      {topCoins >= 150
                        ? 'Nível Ouro VIP'
                        : `Faltam ${Math.max(0, 150 - topCoins)} p/ VIP auto`}
                    </Text>
                  </View>
                </View>

                <View style={localStyles.progressTrack}>
                  <View
                    style={[
                      localStyles.progressFill,
                      { width: `${vipProgressPct}%` as any },
                    ]}
                  />
                </View>
                <Text style={[styles.sectionMeta, { marginTop: 6 }]}>
                  Acumule TopCoins a cada pedido entregue (+1 moeda a cada R$ 10) ou indique
                  amigos (+50 TopCoins).
                </Text>
              </View>

              {/* Lista Real de Recompensas (GET /recompensas) */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>
                    Catálogo de Recompensas (GET /recompensas)
                  </Text>
                </View>
                <Text style={styles.sectionMeta}>{recompensas.length} ativa(s)</Text>
              </View>

              {loadingVip ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#FACC15" />
                  <Text style={[styles.itemDesc, { marginTop: 8 }]}>
                    Carregando recompensas da API PizzariaTop...
                  </Text>
                </View>
              ) : recompensas.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIconBox}>
                    <FontAwesome5 name="gift" size={20} color="#FACC15" />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    Nenhuma recompensa disponível
                  </Text>
                  <Text style={styles.emptyStateDesc}>
                    Puxe para atualizar e consultar novas recompensas cadastradas na API.
                  </Text>
                </View>
              ) : (
                <View style={isWide ? localStyles.twoColGrid : undefined}>
                  {recompensas.map((rec, idx) => {
                    const rid = Number(rec.id_recompensa ?? rec.id ?? idx + 1);
                    const custo = Number(
                      rec.pontos_necessarios ?? rec.custo_pontos ?? 0
                    );
                    const podeResgatar = topCoins >= custo;

                    return (
                      <View
                        key={`vip-rec-${rid}`}
                        style={[
                          styles.crudCard,
                          isWide && { width: '49%' },
                        ]}
                      >
                        <View style={styles.crudCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>
                              {rec.nome ?? rec.titulo ?? `Recompensa #${rid}`}
                            </Text>
                            <Text style={styles.itemDesc}>
                              {rec.descricao || 'Troque seus TopCoins acumulados no Clube TOP'}
                            </Text>
                          </View>
                          <View style={localStyles.costBadge}>
                            <Feather name="zap" size={11} color="#FACC15" />
                            <Text style={localStyles.costBadgeText}>{custo} pts</Text>
                          </View>
                        </View>

                        <View style={styles.crudCardFooter}>
                          <Text
                            style={[
                              styles.sectionMeta,
                              podeResgatar && { color: '#34D399' },
                            ]}
                          >
                            {podeResgatar
                              ? '✓ Saldo disponível'
                              : `Requer ${custo} TopCoins`}
                          </Text>

                          <TouchableOpacity
                            style={[
                              styles.goldCtaBtn,
                              { paddingVertical: 9, paddingHorizontal: 14 },
                            ]}
                            onPress={() => handleResgatar(rec)}
                            disabled={redeemingId === rid}
                            activeOpacity={0.85}
                          >
                            {redeemingId === rid ? (
                              <ActivityIndicator size="small" color="#111827" />
                            ) : (
                              <>
                                <FontAwesome5 name="gift" size={12} color="#111827" />
                                <Text style={[styles.goldCtaText, { fontSize: 12.5 }]}>
                                  Resgatar
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            /* ============================================================
               ABA 2: 📊 PAINEL STAFF/ADMIN & KDS COZINHA
               ============================================================ */
            <View>
              <AdminAuthBanner onAuthChange={carregarPainelAdmin} />

              {/* KPIs Reais via Axios getStats() */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: PIZZARIA_COLORS.violet },
                    ]}
                  />
                  <Text style={styles.sectionTitle}>
                    Indicadores Operacionais (GET /stats)
                  </Text>
                </View>
                <TouchableOpacity
                  style={localStyles.syncPillBtn}
                  onPress={carregarPainelAdmin}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={12} color="#C4B5FD" />
                  <Text style={localStyles.syncPillText}>Sincronizar</Text>
                </TouchableOpacity>
              </View>

              <View style={localStyles.statsKpiRow}>
                <View
                  style={[
                    localStyles.staffKpiCard,
                    { borderColor: 'rgba(250, 204, 21, 0.42)' },
                  ]}
                >
                  <View style={styles.rowGap}>
                    <Feather name="dollar-sign" size={15} color="#FACC15" />
                    <Text style={localStyles.staffKpiLabel}>Faturamento Total</Text>
                  </View>
                  <Text style={[localStyles.staffKpiValue, { color: '#FACC15' }]}>
                    {adminKpis.faturamento}
                  </Text>
                </View>

                <View
                  style={[
                    localStyles.staffKpiCard,
                    { borderColor: 'rgba(56, 189, 248, 0.42)' },
                  ]}
                >
                  <View style={styles.rowGap}>
                    <Feather name="package" size={15} color="#38BDF8" />
                    <Text style={localStyles.staffKpiLabel}>Pedidos Hoje</Text>
                  </View>
                  <Text style={[localStyles.staffKpiValue, { color: '#38BDF8' }]}>
                    {adminKpis.pedidosHoje}
                  </Text>
                </View>

                <View
                  style={[
                    localStyles.staffKpiCard,
                    { borderColor: 'rgba(16, 185, 129, 0.42)' },
                  ]}
                >
                  <View style={styles.rowGap}>
                    <Feather name="users" size={15} color="#10B981" />
                    <Text style={localStyles.staffKpiLabel}>Clientes Totais</Text>
                  </View>
                  <Text style={[localStyles.staffKpiValue, { color: '#10B981' }]}>
                    {adminKpis.clientesTotais}
                  </Text>
                </View>
              </View>

              {adminKpis.topSabores.length > 0 ? (
                <View style={[styles.glassCard, { paddingVertical: 11 }]}>
                  <Text style={[styles.inputLabel, { marginBottom: 8 }]}>
                    🍕 Top Sabores Mais Pedidos (/api/stats)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {adminKpis.topSabores.map((s, idx) => (
                      <View key={`top-sab-${idx}`} style={styles.tagPill}>
                        <Text style={styles.tagPillText}>
                          #{idx + 1} {s.nome_sabor ?? s.nome ?? 'Sabor'}{' '}
                          {s.total ?? s.quantidade ? `(${s.total ?? s.quantidade})` : ''}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Gráfico Nativo em Barras dos Últimos 7 Dias (getStatsChart) */}
              <View style={localStyles.chartCard}>
                <View style={localStyles.chartHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      Receita Diária · Últimos 7 Dias
                    </Text>
                    <Text style={styles.itemDesc}>
                      {chartFromApi
                        ? 'Série oficial carregada via Axios em GET /api/stats/chart'
                        : 'Série agregada dos últimos 7 dias (autentique-se como Admin para /api/stats/chart)'}
                    </Text>
                  </View>
                  <View
                    style={[
                      localStyles.chartSourcePill,
                      chartFromApi && {
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.16)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        localStyles.chartSourceText,
                        chartFromApi && { color: '#6EE7B7' },
                      ]}
                    >
                      {chartFromApi ? 'GET /stats/chart' : '7 DIAS'}
                    </Text>
                  </View>
                </View>

                <View style={localStyles.barsArea}>
                  {chartData.map((bar) => (
                    <View key={bar.key} style={localStyles.barColumn}>
                      <Text style={localStyles.barValueLabel} numberOfLines={1}>
                        {bar.value > 0 ? `R$${Math.round(bar.value)}` : 'R$0'}
                      </Text>
                      <View style={localStyles.barTrack}>
                        <View
                          style={[
                            localStyles.barFill,
                            { height: `${bar.heightPct}%` as any },
                          ]}
                        />
                      </View>
                      <Text style={localStyles.barDayLabel} numberOfLines={1}>
                        {bar.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Quadro KDS da Cozinha */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: PIZZARIA_COLORS.fireOrange },
                    ]}
                  />
                  <Text style={styles.sectionTitle}>
                    Quadro KDS da Cozinha (GET / PUT /pedidos)
                  </Text>
                </View>
                <Text style={styles.sectionMeta}>{pedidosKds.length} pedido(s)</Text>
              </View>

              {/* Colunas Filtro KDS */}
              <View style={localStyles.kdsTabsRow}>
                {KDS_COLUMNS.map((col) => {
                  const active = kdsColumn === col.key;
                  const count = kdsCounts[col.key];
                  return (
                    <TouchableOpacity
                      key={col.key}
                      style={[
                        localStyles.kdsTabBtn,
                        active && {
                          backgroundColor: col.bgTint,
                          borderColor: col.color,
                        },
                      ]}
                      onPress={() => setKdsColumn(col.key)}
                      activeOpacity={0.82}
                    >
                      <View style={styles.rowGap}>
                        <Feather
                          name={col.icon}
                          size={13}
                          color={active ? col.color : PIZZARIA_COLORS.textMuted}
                        />
                        <Text
                          style={[
                            localStyles.kdsTabLabel,
                            active && { color: '#FFFFFF', fontWeight: '900' },
                          ]}
                          numberOfLines={1}
                        >
                          {col.label}
                        </Text>
                      </View>
                      <View
                        style={[
                          localStyles.kdsCountPill,
                          { backgroundColor: active ? col.color : 'rgba(255,255,255,0.1)' },
                        ]}
                      >
                        <Text
                          style={[
                            localStyles.kdsCountText,
                            active && { color: '#111827' },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {loadingAdmin ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={PIZZARIA_COLORS.violet} />
                  <Text style={[styles.itemDesc, { marginTop: 8 }]}>
                    Sincronizando comandas do KDS em GET /api/pedidos...
                  </Text>
                </View>
              ) : pedidosFiltradosKds.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIconBox}>
                    <Feather name="inbox" size={22} color={PIZZARIA_COLORS.gold} />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    Nenhuma comanda nesta coluna
                  </Text>
                  <Text style={styles.emptyStateDesc}>
                    Alterne entre &quot;Pendentes&quot;, &quot;Em Preparo&quot; e &quot;Saiu / Entregue&quot; acima
                    para gerenciar os pedidos.
                  </Text>
                </View>
              ) : (
                <View style={isWide ? localStyles.twoColGrid : undefined}>
                  {pedidosFiltradosKds.map((ped, idx) => {
                    const pid = Number(ped.id_pedido ?? ped.id ?? idx + 1);
                    const col = classifyKdsOrder(ped.status_pedido);
                    const delivered = isOrderDelivered(ped.status_pedido);
                    const isBusy = updatingOrderId === pid;
                    const enderecoLinha = [
                      ped.logradouro ?? ped.rua,
                      ped.numero,
                      ped.bairro,
                    ]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <View
                        key={`kds-order-${pid}`}
                        style={[
                          localStyles.kdsCard,
                          isWide && { width: '49%' },
                          col === 'em_preparo' && {
                            borderColor: 'rgba(255, 107, 53, 0.48)',
                          },
                          col === 'saiu_entregue' && {
                            borderColor: 'rgba(16, 185, 129, 0.42)',
                          },
                        ]}
                      >
                        <View style={styles.crudCardHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={[styles.rowGap, { marginBottom: 4 }]}>
                              <Text style={localStyles.kdsOrderNumber}>
                                Comanda #{pid}
                              </Text>
                              <View
                                style={[
                                  styles.statusPill,
                                  {
                                    backgroundColor:
                                      col === 'pendentes'
                                        ? 'rgba(250, 204, 21, 0.18)'
                                        : col === 'em_preparo'
                                        ? 'rgba(255, 107, 53, 0.22)'
                                        : 'rgba(16, 185, 129, 0.20)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    {
                                      color:
                                        col === 'pendentes'
                                          ? '#FACC15'
                                          : col === 'em_preparo'
                                          ? '#FDBA74'
                                          : '#6EE7B7',
                                    },
                                  ]}
                                >
                                  {ped.status_pedido || 'pendente'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.itemTitle}>
                              {ped.nome_cliente || `Cliente #${ped.id_usuario ?? 'App'}`}
                            </Text>
                            {enderecoLinha ? (
                              <Text style={styles.itemDesc} numberOfLines={1}>
                                📍 {enderecoLinha}
                              </Text>
                            ) : null}
                            {ped.observacoes ? (
                              <Text
                                style={[
                                  styles.itemDesc,
                                  { color: '#FDE68A', marginTop: 3 },
                                ]}
                                numberOfLines={2}
                              >
                                📝 Obs: {ped.observacoes}
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.priceText}>
                              {formatCurrency(ped.valor_total)}
                            </Text>
                            {ped.forma_pagamento ? (
                              <Text style={styles.sectionMeta}>
                                {ped.forma_pagamento.toUpperCase()}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Ações 1-clique KDS via PUT /pedidos/{id} */}
                        <View style={styles.crudCardFooter}>
                          {col === 'pendentes' ? (
                            <TouchableOpacity
                              style={[localStyles.kdsActionBtn, localStyles.kdsBtnFire]}
                              onPress={() => handleAdvanceOrderStatus(ped, 'preparando')}
                              disabled={isBusy}
                              activeOpacity={0.85}
                            >
                              {isBusy ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <>
                                  <FontAwesome5 name="fire" size={13} color="#FFFFFF" />
                                  <Text style={localStyles.kdsActionBtnText}>
                                    Iniciar Preparo →
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          ) : col === 'em_preparo' ? (
                            <TouchableOpacity
                              style={[localStyles.kdsActionBtn, localStyles.kdsBtnCyan]}
                              onPress={() =>
                                handleAdvanceOrderStatus(ped, 'saiu_entrega')
                              }
                              disabled={isBusy}
                              activeOpacity={0.85}
                            >
                              {isBusy ? (
                                <ActivityIndicator size="small" color="#111827" />
                              ) : (
                                <>
                                  <Feather name="truck" size={14} color="#111827" />
                                  <Text
                                    style={[
                                      localStyles.kdsActionBtnText,
                                      { color: '#111827' },
                                    ]}
                                  >
                                    Despachar Entrega →
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          ) : !delivered ? (
                            <TouchableOpacity
                              style={[
                                localStyles.kdsActionBtn,
                                localStyles.kdsBtnEmerald,
                              ]}
                              onPress={() => handleAdvanceOrderStatus(ped, 'entregue')}
                              disabled={isBusy}
                              activeOpacity={0.85}
                            >
                              {isBusy ? (
                                <ActivityIndicator size="small" color="#111827" />
                              ) : (
                                <>
                                  <Feather
                                    name="check-circle"
                                    size={14}
                                    color="#111827"
                                  />
                                  <Text
                                    style={[
                                      localStyles.kdsActionBtnText,
                                      { color: '#111827' },
                                    ]}
                                  >
                                    Confirmar Entrega ✓
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={localStyles.deliveredFooterRow}>
                              <View style={styles.rowGap}>
                                <Feather
                                  name="check-circle"
                                  size={15}
                                  color="#10B981"
                                />
                                <Text style={localStyles.deliveredText}>
                                  Pedido Entregue & Finalizado
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={localStyles.reopenMiniBtn}
                                onPress={() =>
                                  handleAdvanceOrderStatus(ped, 'preparando')
                                }
                                disabled={isBusy}
                              >
                                <Text style={localStyles.reopenMiniBtnText}>
                                  Reabrir
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}

const vipShadow = createShadow({
  color: '#FACC15',
  offset: { width: 0, height: 6 },
  opacity: 0.25,
  radius: 16,
  elevation: 7,
});

const localStyles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#151824',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 13,
  },
  segmentTabVipActive: {
    backgroundColor: '#FACC15',
  },
  segmentTabAdminActive: {
    backgroundColor: '#7C3AED',
  },
  segmentTabText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  segmentTabTextDark: {
    color: '#111827',
    fontWeight: '900',
  },
  segmentTabTextLight: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  vipCard: {
    backgroundColor: PIZZARIA_COLORS.vipIndigo,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.50)',
    padding: 20,
    marginBottom: 14,
    overflow: 'hidden',
    ...vipShadow,
  },
  vipOrbTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: PIZZARIA_COLORS.vipIndigoLight,
  },
  vipOrbBottom: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
  },
  vipTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  vipCrownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  vipCrownPillText: {
    color: '#FEF08A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipActiveSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  vipActiveSealText: {
    color: '#6EE7B7',
    fontSize: 10.5,
    fontWeight: '900',
  },
  vipTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  vipSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  vipPriceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    marginBottom: 16,
  },
  vipPriceMain: {
    color: '#FACC15',
    fontSize: 28,
    fontWeight: '900',
  },
  vipPricePeriod: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '700',
  },
  benefitsList: {
    gap: 10,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  benefitIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 13.5,
    fontWeight: '700',
  },
  vipActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsBigValue: {
    color: '#FACC15',
    fontSize: 20,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FACC15',
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  costBadgeText: {
    color: '#FACC15',
    fontSize: 11.5,
    fontWeight: '900',
  },
  syncPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  syncPillText: {
    color: '#DDD6FE',
    fontSize: 11.5,
    fontWeight: '800',
  },
  statsKpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  staffKpiCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: '#1B1429',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    ...Platform.select({
      web: { boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.38)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  staffKpiLabel: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  staffKpiValue: {
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#171524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.32)',
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  chartSourcePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  chartSourceText: {
    color: '#FACC15',
    fontSize: 10.5,
    fontWeight: '900',
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 168,
    gap: 6,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueLabel: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
  },
  barTrack: {
    width: '72%',
    maxWidth: 36,
    height: 112,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#FACC15',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  barDayLabel: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },
  kdsTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  kdsTabBtn: {
    flex: 1,
    minWidth: 135,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  kdsTabLabel: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  kdsCountPill: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  kdsCountText: {
    color: '#F9FAFB',
    fontSize: 11,
    fontWeight: '900',
  },
  kdsCard: {
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    padding: 15,
    marginBottom: 12,
  },
  kdsOrderNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  kdsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  kdsBtnFire: {
    backgroundColor: PIZZARIA_COLORS.fireOrange,
  },
  kdsBtnCyan: {
    backgroundColor: '#38BDF8',
  },
  kdsBtnEmerald: {
    backgroundColor: '#10B981',
  },
  kdsActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  deliveredFooterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveredText: {
    color: '#6EE7B7',
    fontSize: 12.5,
    fontWeight: '800',
  },
  reopenMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  reopenMiniBtnText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
