import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  createSabor,
  deleteSabor,
  extractErrorMessage,
  formatCurrency,
  getSaborById,
  getSabores,
  Sabor,
  SaborCategoria,
  SaborPayload,
  updateSabor,
} from '../../services/pizzariatopApi';
import {
  getPizzaImageSource,
  getPizzaRichDescription,
} from '../../utils/pizzaImageMap';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { AdminAuthBanner } from '../../components/pizzariatop/AdminAuthBanner';
import { ConfirmDeleteModal } from '../../components/pizzariatop/ConfirmDeleteModal';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { SaborFormModal } from '../../components/pizzariatop/SaborFormModal';

type CategoriaFiltro = 'todas' | SaborCategoria;
type SaborSortMode = 'destaques' | 'az' | 'menor_preco';

const BASE_PIZZA_GRANDE_PRECO = 45;

const FILTRO_CATEGORIAS: { key: CategoriaFiltro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'tradicional', label: 'Tradicional' },
  { key: 'especial', label: 'Especial' },
  { key: 'premium', label: 'Premium' },
  { key: 'doce', label: 'Doce' },
];

const SORT_OPTIONS: {
  key: SaborSortMode;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: 'destaques', label: 'Destaques', icon: 'star' },
  { key: 'az', label: 'A-Z', icon: 'type' },
  { key: 'menor_preco', label: 'Menor Preço', icon: 'trending-down' },
];

const CATEGORIA_BADGE_THEME: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  tradicional: {
    color: '#FDBA74',
    bg: 'rgba(255, 107, 53, 0.15)',
    border: 'rgba(255, 107, 53, 0.42)',
  },
  especial: {
    color: '#FACC15',
    bg: 'rgba(250, 204, 21, 0.16)',
    border: 'rgba(250, 204, 21, 0.45)',
  },
  premium: {
    color: '#C4B5FD',
    bg: 'rgba(139, 92, 246, 0.18)',
    border: 'rgba(139, 92, 246, 0.48)',
  },
  doce: {
    color: '#F9A8D4',
    bg: 'rgba(244, 114, 182, 0.16)',
    border: 'rgba(244, 114, 182, 0.45)',
  },
};

const HTTP_BADGES: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  bg: string;
  border: string;
  color: string;
}[] = [
  {
    method: 'GET',
    bg: 'rgba(6, 182, 212, 0.16)',
    border: 'rgba(6, 182, 212, 0.42)',
    color: PIZZARIA_COLORS.cyan,
  },
  {
    method: 'POST',
    bg: 'rgba(34, 197, 94, 0.16)',
    border: PIZZARIA_COLORS.basilBorder,
    color: PIZZARIA_COLORS.emerald,
  },
  {
    method: 'PUT',
    bg: 'rgba(245, 158, 11, 0.16)',
    border: PIZZARIA_COLORS.goldBorder,
    color: PIZZARIA_COLORS.gold,
  },
  {
    method: 'DELETE',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: PIZZARIA_COLORS.errorBorder,
    color: '#FCA5A5',
  },
];

function getSaborId(sabor: Sabor): number {
  return Number(sabor.id_sabor ?? sabor.id ?? 0);
}

function isFlagActive(val: unknown, fallback = false): boolean {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const n = val.trim().toLowerCase();
    return n === 'true' || n === '1';
  }
  return Boolean(val);
}

function normalizeCategoria(sabor: Sabor): SaborCategoria {
  const raw = String(sabor.categoria_sabor ?? '').trim().toLowerCase();
  if (raw === 'tradicional' || raw === 'especial' || raw === 'premium' || raw === 'doce') {
    return raw;
  }
  const nomeLower = String(sabor.nome_sabor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (
    nomeLower.includes('chocolate') ||
    nomeLower.includes('morango') ||
    nomeLower.includes('banana') ||
    nomeLower.includes('romeu') ||
    nomeLower.includes('brigadeiro') ||
    nomeLower.includes('nutella')
  ) {
    return 'doce';
  }
  if (
    nomeLower.includes('camarao') ||
    nomeLower.includes('carne seca') ||
    nomeLower.includes('4 queijos') ||
    nomeLower.includes('quatro queijos')
  ) {
    return 'especial';
  }
  return 'tradicional';
}

function formatCategoriaLabel(cat?: string | null, sabor?: Sabor): string {
  const normalized = sabor
    ? normalizeCategoria(sabor)
    : String(cat ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'tradicional':
      return 'Tradicional';
    case 'especial':
      return 'Especial';
    case 'premium':
      return 'Premium';
    case 'doce':
      return 'Doce';
    default:
      return cat ? String(cat) : 'Tradicional';
  }
}

export default function SaboresCrudScreen() {
  const { addToCart, cartCount } = usePizzariaTop();

  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaFiltro>('todas');
  const [sortMode, setSortMode] = useState<SaborSortMode>('destaques');

  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    message: string;
  } | null>(null);

  // Modal Criar / Editar (POST / PUT + GET /:id)
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingSabor, setEditingSabor] = useState<Sabor | null>(null);
  const [fetchingEditById, setFetchingEditById] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Detalhes (GET /sabores/:id)
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailSabor, setDetailSabor] = useState<Sabor | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Excluir (DELETE /sabores/:id)
  const [deletingTarget, setDeletingTarget] = useState<Sabor | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchSabores = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const list = await getSabores(false);
      setSabores(list);
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Não foi possível carregar os sabores da API.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSabores(false);
  }, [fetchSabores]);

  // Contadores para a barra de mini-KPIs
  const kpiStats = useMemo(() => {
    let destaques = 0;
    let doces = 0;
    let especiais = 0;
    for (const s of sabores) {
      if (isFlagActive(s.destaque, false)) destaques += 1;
      const cat = normalizeCategoria(s);
      if (cat === 'doce') doces += 1;
      if (cat === 'especial' || cat === 'premium') especiais += 1;
    }
    return {
      total: sabores.length,
      destaques,
      doces,
      especiais,
    };
  }, [sabores]);

  const filteredSabores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = sabores.filter((item) => {
      const cat = normalizeCategoria(item);
      if (selectedCategoria !== 'todas' && cat !== selectedCategoria) {
        return false;
      }
      if (!q) return true;
      const nome = String(item.nome_sabor ?? '').toLowerCase();
      const desc = String(item.descricao ?? '').toLowerCase();
      return nome.includes(q) || desc.includes(q);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortMode === 'az') {
        return String(a.nome_sabor ?? '').localeCompare(
          String(b.nome_sabor ?? ''),
          'pt-BR',
          { sensitivity: 'base' }
        );
      }
      if (sortMode === 'menor_preco') {
        const pa = Number(a.preco_adicional ?? 0);
        const pb = Number(b.preco_adicional ?? 0);
        if (pa !== pb) return pa - pb;
        return String(a.nome_sabor ?? '').localeCompare(
          String(b.nome_sabor ?? ''),
          'pt-BR',
          { sensitivity: 'base' }
        );
      }
      // 'destaques': destaques ativos primeiro -> disponíveis -> nome
      const da = isFlagActive(a.destaque, false) ? 1 : 0;
      const db = isFlagActive(b.destaque, false) ? 1 : 0;
      if (da !== db) return db - da;
      const ava = isFlagActive(a.disponivel, true) ? 1 : 0;
      const avb = isFlagActive(b.disponivel, true) ? 1 : 0;
      if (ava !== avb) return avb - ava;
      return String(a.nome_sabor ?? '').localeCompare(
        String(b.nome_sabor ?? ''),
        'pt-BR',
        { sensitivity: 'base' }
      );
    });

    return sorted;
  }, [sabores, searchQuery, selectedCategoria, sortMode]);

  const handleQuickOrder = (sabor: Sabor) => {
    const disponivel = isFlagActive(sabor.disponivel, true);
    if (!disponivel) {
      setFeedback({
        type: 'info',
        message: `O sabor "${sabor.nome_sabor}" está temporariamente indisponível.`,
      });
      return;
    }
    const id = getSaborId(sabor) || 1;
    const adicional = Number(sabor.preco_adicional ?? 0);
    const precoUnitario = Number((BASE_PIZZA_GRANDE_PRECO + adicional).toFixed(2));

    addToCart({
      id_produto: id,
      tipo_item: 'pizza',
      nome: `Pizza ${sabor.nome_sabor} (Grande)`,
      detalhes: `Sabor: ${sabor.nome_sabor} · Grande (8 fatias) · Massa Tradicional`,
      quantidade: 1,
      preco_unitario: precoUnitario,
    });

    setFeedback({
      type: 'success',
      message: `🍕 Pizza de "${sabor.nome_sabor}" (${formatCurrency(
        precoUnitario
      )}) adicionada ao carrinho!`,
    });
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingSabor(null);
    setFormError(null);
    setFetchingEditById(false);
    setFormVisible(true);
  };

  const handleOpenEdit = async (sabor: Sabor) => {
    const id = getSaborId(sabor);
    setFormMode('edit');
    setEditingSabor(sabor);
    setFormError(null);
    setFormVisible(true);

    if (!id) return;
    setFetchingEditById(true);
    try {
      const fresh = await getSaborById(id);
      if (fresh && (fresh.nome_sabor || fresh.id || fresh.id_sabor)) {
        setEditingSabor(fresh);
      }
    } catch (err) {
      setFormError(
        `Aviso ao consultar GET /sabores/${id}: ${extractErrorMessage(err)}`
      );
    } finally {
      setFetchingEditById(false);
    }
  };

  const handleOpenDetails = async (sabor: Sabor) => {
    const id = getSaborId(sabor);
    setDetailSabor(sabor);
    setDetailVisible(true);

    if (!id) return;
    setLoadingDetail(true);
    try {
      const fresh = await getSaborById(id);
      if (fresh && (fresh.nome_sabor || fresh.id || fresh.id_sabor)) {
        setDetailSabor(fresh);
      }
      setFeedback({
        type: 'info',
        message: `GET /api/sabores/${id} consultado com sucesso.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, `Erro ao consultar GET /api/sabores/${id}.`),
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmitForm = async (payload: SaborPayload) => {
    setSubmittingForm(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        await createSabor(payload);
        setFormVisible(false);
        setFeedback({
          type: 'success',
          message: `Sabor "${payload.nome_sabor}" cadastrado com sucesso (POST /api/sabores).`,
        });
      } else {
        const id = editingSabor ? getSaborId(editingSabor) : 0;
        if (!id) {
          throw new Error('ID do sabor inválido para atualização.');
        }
        await updateSabor(id, payload);
        setFormVisible(false);
        setEditingSabor(null);
        setFeedback({
          type: 'success',
          message: `Sabor "${payload.nome_sabor}" atualizado com sucesso (PUT /api/sabores/${id}).`,
        });
      }
      await fetchSabores(true);
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        formMode === 'create'
          ? 'Erro ao cadastrar sabor na API.'
          : 'Erro ao atualizar sabor na API.'
      );
      setFormError(msg);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    const id = getSaborId(deletingTarget);
    const nome = deletingTarget.nome_sabor;
    setDeletingLoading(true);
    try {
      await deleteSabor(id);
      setDeletingTarget(null);
      setFeedback({
        type: 'success',
        message: `Sabor "${nome}" excluído com sucesso (DELETE /api/sabores/${id}).`,
      });
      await fetchSabores(true);
    } catch (err) {
      const msg = extractErrorMessage(err, `Erro ao excluir o sabor "${nome}".`);
      setDeletingTarget(null);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setDeletingLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.maxWidthWrap}>
      {/* Hero Banner CRUD Sabores */}
      <View style={styles.heroCard}>
        <View style={styles.heroFireStripe} />
        <View style={styles.heroGlowAccent} />
        <View style={styles.heroBody}>
          <View style={styles.heroBadge}>
            <FontAwesome5 name="fire" size={11} color={PIZZARIA_COLORS.gold} />
            <Text style={styles.heroBadgeText}>TELA 1 · API REST AXIOS</Text>
          </View>

          <Text style={styles.heroTitle}>Sabores · CRUD & Vitrine</Text>
          <Text style={styles.heroSubtitle}>
            Gerenciamento completo do recurso /api/sabores com fotos oficiais, listagem,
            consulta por ID, cadastro, atualização, exclusão e pedido rápido.
          </Text>

          <View style={styles.httpPillRow}>
            {HTTP_BADGES.map((badge) => (
              <View
                key={badge.method}
                style={[
                  styles.httpPill,
                  { backgroundColor: badge.bg, borderColor: badge.border },
                ]}
              >
                <Text style={[styles.httpPillText, { color: badge.color }]}>
                  {badge.method}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.heroActionsRow, { marginTop: 14 }]}>
            <TouchableOpacity
              style={styles.primaryCtaBtn}
              onPress={handleOpenCreate}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#FFF7ED" />
              <Text style={styles.primaryCtaText}>Novo Sabor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => fetchSabores(true)}
              disabled={refreshing || loading}
              activeOpacity={0.8}
            >
              <Feather
                name="refresh-cw"
                size={14}
                color={PIZZARIA_COLORS.textPrimary}
              />
              <Text style={styles.ghostBtnText}>
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </Text>
            </TouchableOpacity>

            {cartCount > 0 ? (
              <TouchableOpacity
                style={styles.goldCtaBtn}
                onPress={() => router.push('/Atividade15_PizzariaTop/pedidos')}
                activeOpacity={0.85}
              >
                <Feather name="shopping-cart" size={15} color="#111827" />
                <Text style={styles.goldCtaText}>Carrinho ({cartCount})</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Autenticação Admin (necessária para PUT e DELETE em produção) */}
      <AdminAuthBanner />

      {/* Feedback Banner para operações CRUD e Pedido Rápido */}
      {feedback ? (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      {/* Barra de Mini-KPIs (Total · Destaques · Doces · Especiais) */}
      <View style={localStyles.kpiStrip}>
        <TouchableOpacity
          style={[
            localStyles.kpiCard,
            selectedCategoria === 'todas' && localStyles.kpiCardActiveOrange,
          ]}
          onPress={() => setSelectedCategoria('todas')}
          activeOpacity={0.82}
        >
          <View style={[localStyles.kpiIconCircle, { backgroundColor: 'rgba(255, 107, 53, 0.18)' }]}>
            <FontAwesome5 name="pizza-slice" size={13} color={PIZZARIA_COLORS.fireOrange} />
          </View>
          <View>
            <Text style={localStyles.kpiValue}>{kpiStats.total}</Text>
            <Text style={localStyles.kpiLabel}>Total</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            localStyles.kpiCard,
            sortMode === 'destaques' && localStyles.kpiCardActiveGold,
          ]}
          onPress={() => setSortMode('destaques')}
          activeOpacity={0.82}
        >
          <View style={[localStyles.kpiIconCircle, { backgroundColor: 'rgba(250, 204, 21, 0.18)' }]}>
            <Feather name="star" size={14} color={PIZZARIA_COLORS.gold} />
          </View>
          <View>
            <Text style={[localStyles.kpiValue, { color: PIZZARIA_COLORS.gold }]}>
              {kpiStats.destaques}
            </Text>
            <Text style={localStyles.kpiLabel}>Destaques</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            localStyles.kpiCard,
            selectedCategoria === 'doce' && localStyles.kpiCardActivePink,
          ]}
          onPress={() =>
            setSelectedCategoria((prev) => (prev === 'doce' ? 'todas' : 'doce'))
          }
          activeOpacity={0.82}
        >
          <View style={[localStyles.kpiIconCircle, { backgroundColor: 'rgba(244, 114, 182, 0.18)' }]}>
            <Feather name="heart" size={14} color="#F472B6" />
          </View>
          <View>
            <Text style={[localStyles.kpiValue, { color: '#F9A8D4' }]}>
              {kpiStats.doces}
            </Text>
            <Text style={localStyles.kpiLabel}>Doces</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            localStyles.kpiCard,
            selectedCategoria === 'especial' && localStyles.kpiCardActiveViolet,
          ]}
          onPress={() =>
            setSelectedCategoria((prev) => (prev === 'especial' ? 'todas' : 'especial'))
          }
          activeOpacity={0.82}
        >
          <View style={[localStyles.kpiIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.18)' }]}>
            <Feather name="award" size={14} color="#C4B5FD" />
          </View>
          <View>
            <Text style={[localStyles.kpiValue, { color: '#C4B5FD' }]}>
              {kpiStats.especiais}
            </Text>
            <Text style={localStyles.kpiLabel}>Especiais</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Barra de Busca */}
      <View style={styles.searchBarWrap}>
        <Feather name="search" size={16} color={PIZZARIA_COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar sabor por nome ou descrição..."
          placeholderTextColor={PIZZARIA_COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Feather name="x-circle" size={16} color={PIZZARIA_COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros por Categoria */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipRow}
      >
        {FILTRO_CATEGORIAS.map((cat) => {
          const isActive = selectedCategoria === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedCategoria(cat.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Chips de Ordenação (Destaques · A-Z · Menor Preço) */}
      <View style={localStyles.sortStripRow}>
        <View style={localStyles.sortLabelWrap}>
          <Feather name="sliders" size={13} color={PIZZARIA_COLORS.gold} />
          <Text style={localStyles.sortLabelText}>Ordenar:</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.sortChipsContent}
        >
          {SORT_OPTIONS.map((opt) => {
            const active = sortMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[localStyles.sortChip, active && localStyles.sortChipActive]}
                onPress={() => setSortMode(opt.key)}
                activeOpacity={0.8}
              >
                <Feather
                  name={opt.icon}
                  size={12}
                  color={active ? '#111827' : PIZZARIA_COLORS.gold}
                />
                <Text
                  style={[
                    localStyles.sortChipText,
                    active && localStyles.sortChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cabeçalho da listagem */}
      <View style={styles.crudHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Catálogo de Sabores</Text>
        </View>
        <View style={styles.crudCountBadge}>
          <Text style={styles.crudCountText}>
            {filteredSabores.length} de {sabores.length}
          </Text>
        </View>
      </View>

      {/* Estado de erro na carga inicial */}
      {loadError ? (
        <View style={styles.errorCard}>
          <Feather
            name="wifi-off"
            size={24}
            color="#FCA5A5"
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={() => fetchSabores(false)}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={14} color="#FFF7ED" />
            <Text style={styles.primaryCtaText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderSaborCard = ({ item }: { item: Sabor }) => {
    const id = getSaborId(item);
    const disponivel = isFlagActive(item.disponivel, true);
    const destaque = isFlagActive(item.destaque, false);
    const precoNum = Number(item.preco_adicional ?? 0);
    const categoriaNorm = normalizeCategoria(item);
    const catTheme = CATEGORIA_BADGE_THEME[categoriaNorm] ?? CATEGORIA_BADGE_THEME.tradicional;
    const pizzaImgSource = getPizzaImageSource(item.nome_sabor, item.imagem_url);
    const descricaoRica = getPizzaRichDescription(item.nome_sabor, item.descricao);

    return (
      <View style={styles.maxWidthWrap}>
        <TouchableOpacity
          style={[
            styles.crudCard,
            destaque && { borderColor: PIZZARIA_COLORS.goldBorder },
          ]}
          onPress={() => handleOpenDetails(item)}
          activeOpacity={0.88}
        >
          <View style={styles.crudCardHeader}>
            <View style={[styles.menuItemRow, { flex: 1, alignItems: 'flex-start' }]}>
              <View style={localStyles.pizzaThumbOuter}>
                <View
                  style={[
                    localStyles.pizzaThumbFrame,
                    {
                      borderColor: destaque
                        ? PIZZARIA_COLORS.gold
                        : PIZZARIA_COLORS.fireOrange,
                    },
                  ]}
                >
                  <Image
                    source={pizzaImgSource}
                    style={localStyles.pizzaThumbImg}
                    resizeMode="cover"
                  />
                </View>
                {destaque ? (
                  <View style={localStyles.pizzaThumbStarBadge}>
                    <Feather name="star" size={10} color="#111827" />
                  </View>
                ) : null}
              </View>

              <View style={{ flex: 1 }}>
                <View style={[styles.rowGap, { gap: 6, flexWrap: 'wrap' }]}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.nome_sabor}
                  </Text>
                  <Text style={styles.sectionMeta}>#{id}</Text>
                </View>

                <Text style={styles.itemDesc} numberOfLines={2}>
                  {descricaoRica}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.crudMetaRow}>
            <View
              style={[
                styles.tagPill,
                { backgroundColor: catTheme.bg, borderColor: catTheme.border },
              ]}
            >
              <Text style={[styles.tagPillText, { color: catTheme.color }]}>
                {formatCategoriaLabel(item.categoria_sabor, item)}
              </Text>
            </View>

            <View
              style={[
                styles.availabilityBadge,
                disponivel
                  ? styles.availabilityBadgeActive
                  : styles.availabilityBadgeInactive,
              ]}
            >
              <Feather
                name={disponivel ? 'check-circle' : 'slash'}
                size={11}
                color={disponivel ? PIZZARIA_COLORS.emerald : '#FCA5A5'}
              />
              <Text
                style={[
                  styles.availabilityText,
                  { color: disponivel ? PIZZARIA_COLORS.emerald : '#FCA5A5' },
                ]}
              >
                {disponivel ? 'Disponível' : 'Indisponível'}
              </Text>
            </View>

            {destaque ? (
              <View style={styles.featuredStarBadge}>
                <Feather name="star" size={11} color={PIZZARIA_COLORS.gold} />
                <Text
                  style={[
                    styles.availabilityText,
                    { color: PIZZARIA_COLORS.gold },
                  ]}
                >
                  Destaque
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.crudCardFooter, { flexWrap: 'wrap' }]}>
            <View>
              <Text style={styles.sectionMeta}>Adicional Sabor</Text>
              <Text style={styles.priceText}>
                {precoNum > 0 ? `+ ${formatCurrency(precoNum)}` : 'Incluso (R$ 0,00)'}
              </Text>
            </View>

            <View style={[styles.crudActionsRow, { flexWrap: 'wrap', justifyContent: 'flex-end' }]}>
              <TouchableOpacity
                style={[
                  localStyles.quickOrderBtn,
                  !disponivel && { opacity: 0.45 },
                ]}
                onPress={() => handleQuickOrder(item)}
                activeOpacity={0.82}
              >
                <Feather name="shopping-cart" size={13} color="#111827" />
                <Text style={localStyles.quickOrderBtnText}>Pedir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={localStyles.getByIdBtn}
                onPress={() => handleOpenDetails(item)}
                activeOpacity={0.8}
              >
                <Feather name="eye" size={13} color={PIZZARIA_COLORS.cyan} />
                <Text style={localStyles.getByIdBtnText}>GET /:id</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editActionBtn}
                onPress={() => handleOpenEdit(item)}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={13} color={PIZZARIA_COLORS.gold} />
                <Text style={styles.editActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteActionBtn}
                onPress={() => setDeletingTarget(item)}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={13} color="#FCA5A5" />
                <Text style={styles.deleteActionText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={PIZZARIA_COLORS.fireOrange} />
          <Text style={[styles.itemDesc, { marginTop: 12 }]}>
            Carregando sabores via GET /api/sabores...
          </Text>
        </View>
      );
    }
    if (loadError) return null;

    return (
      <View style={styles.maxWidthWrap}>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIconBox}>
            <FontAwesome5
              name="pizza-slice"
              size={20}
              color={PIZZARIA_COLORS.fireOrange}
            />
          </View>
          <Text style={styles.emptyStateTitle}>Nenhum sabor encontrado</Text>
          <Text style={styles.emptyStateDesc}>
            {searchQuery || selectedCategoria !== 'todas'
              ? 'Ajuste a busca ou o filtro de categoria para visualizar outros sabores.'
              : 'Cadastre o primeiro sabor tocando em "Novo Sabor".'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <PizzariaTopShell
      activeTab="sabores"
      subtitle="Tela 1 · /api/sabores (Axios)"
    >
      <FlatList
        data={filteredSabores}
        keyExtractor={(item, idx) => String(getSaborId(item) || idx)}
        renderItem={renderSaborCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSabores(true)}
            tintColor={PIZZARIA_COLORS.fireOrange}
            colors={[PIZZARIA_COLORS.fireOrange]}
          />
        }
      />

      {/* Modal Criar / Editar Sabor (POST / PUT) */}
      <SaborFormModal
        visible={formVisible}
        mode={formMode}
        initialSabor={editingSabor}
        loading={submittingForm}
        fetchingDetails={fetchingEditById}
        errorMessage={formError}
        onClearError={() => setFormError(null)}
        onCancel={() => {
          if (!submittingForm) {
            setFormVisible(false);
            setFormError(null);
          }
        }}
        onSubmit={handleSubmitForm}
      />

      {/* Modal Confirmar Exclusão (DELETE) */}
      <ConfirmDeleteModal
        visible={Boolean(deletingTarget)}
        title="Excluir Sabor"
        itemName={deletingTarget?.nome_sabor ?? ''}
        loading={deletingLoading}
        onCancel={() => {
          if (!deletingLoading) setDeletingTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal Detalhes do Sabor (GET /api/sabores/:id) */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.rowGap, { gap: 8, marginBottom: 4 }]}>
                  <View
                    style={[
                      styles.httpPill,
                      {
                        backgroundColor: 'rgba(6, 182, 212, 0.16)',
                        borderColor: 'rgba(6, 182, 212, 0.42)',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.httpPillText, { color: PIZZARIA_COLORS.cyan }]}
                    >
                      GET /:id
                    </Text>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {detailSabor?.nome_sabor ?? 'Detalhes do Sabor'}
                  </Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Consulta individual · GET /api/sabores/
                  {detailSabor ? getSaborId(detailSabor) : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailVisible(false)}
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={PIZZARIA_COLORS.cyan} />
                <Text style={[styles.itemDesc, { marginTop: 8 }]}>
                  Consultando registro atualizado na API...
                </Text>
              </View>
            ) : detailSabor ? (
              <View style={styles.modalBody}>
                <View style={localStyles.detailBannerWrap}>
                  <Image
                    source={getPizzaImageSource(
                      detailSabor.nome_sabor,
                      detailSabor.imagem_url
                    )}
                    style={localStyles.detailBannerImg}
                    resizeMode="cover"
                  />
                </View>

                <Text
                  style={[
                    styles.itemDesc,
                    { color: PIZZARIA_COLORS.textSecondary, marginBottom: 12 },
                  ]}
                >
                  {getPizzaRichDescription(
                    detailSabor.nome_sabor,
                    detailSabor.descricao
                  )}
                </Text>

                <View style={styles.crudMetaRow}>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>
                      ID #{getSaborId(detailSabor)}
                    </Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>
                      {formatCategoriaLabel(detailSabor.categoria_sabor, detailSabor)}
                    </Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={[styles.tagPillText, { color: PIZZARIA_COLORS.gold }]}>
                      +{formatCurrency(detailSabor.preco_adicional)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.availabilityBadge,
                      isFlagActive(detailSabor.disponivel, true)
                        ? styles.availabilityBadgeActive
                        : styles.availabilityBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityText,
                        {
                          color: isFlagActive(detailSabor.disponivel, true)
                            ? PIZZARIA_COLORS.emerald
                            : '#FCA5A5',
                        },
                      ]}
                    >
                      {isFlagActive(detailSabor.disponivel, true)
                        ? 'Disponível'
                        : 'Indisponível'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDetailVisible(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
              {detailSabor ? (
                <>
                  <TouchableOpacity
                    style={[styles.goldCtaBtn, { flex: 1 }]}
                    onPress={() => {
                      const target = detailSabor;
                      setDetailVisible(false);
                      handleQuickOrder(target);
                    }}
                  >
                    <Feather name="shopping-cart" size={14} color="#111827" />
                    <Text style={styles.goldCtaText}>Pedir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryCtaBtn, { flex: 1.1 }]}
                    onPress={() => {
                      const target = detailSabor;
                      setDetailVisible(false);
                      handleOpenEdit(target);
                    }}
                  >
                    <Feather name="edit-2" size={14} color="#FFF7ED" />
                    <Text style={styles.primaryCtaText}>Editar</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </PizzariaTopShell>
  );
}

const localStyles = StyleSheet.create({
  kpiStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    paddingVertical: 10,
    paddingHorizontal: 11,
  },
  kpiCardActiveOrange: {
    borderColor: PIZZARIA_COLORS.fireOrange,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  kpiCardActiveGold: {
    borderColor: PIZZARIA_COLORS.goldBorder,
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
  },
  kpiCardActivePink: {
    borderColor: 'rgba(244, 114, 182, 0.55)',
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
  },
  kpiCardActiveViolet: {
    borderColor: PIZZARIA_COLORS.violetBorder,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  kpiLabel: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  sortStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sortLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortLabelText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  sortChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.32)',
  },
  sortChipActive: {
    backgroundColor: PIZZARIA_COLORS.gold,
    borderColor: '#FEF08A',
  },
  sortChipText: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '800',
  },
  sortChipTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  pizzaThumbOuter: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  pizzaThumbFrame: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: PIZZARIA_COLORS.bgElevated,
    overflow: 'hidden',
  },
  pizzaThumbImg: {
    width: '100%',
    height: '100%',
  },
  pizzaThumbStarBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PIZZARIA_COLORS.gold,
    borderWidth: 2,
    borderColor: PIZZARIA_COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: PIZZARIA_COLORS.gold,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  quickOrderBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  getByIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.40)',
  },
  getByIdBtnText: {
    color: PIZZARIA_COLORS.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  detailBannerWrap: {
    width: '100%',
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.goldBorder,
    marginBottom: 12,
    backgroundColor: PIZZARIA_COLORS.bgElevated,
  },
  detailBannerImg: {
    width: '100%',
    height: '100%',
  },
});
