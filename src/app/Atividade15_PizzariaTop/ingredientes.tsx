import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Feather } from '@expo/vector-icons';
import {
  createIngrediente,
  deleteIngrediente,
  extractErrorMessage,
  formatCurrency,
  getIngredienteById,
  getIngredientes,
  Ingrediente,
  IngredientePayload,
  IngredienteTipo,
  resolveImageUrl,
  updateIngrediente,
} from '../../services/pizzariatopApi';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { AdminAuthBanner } from '../../components/pizzariatop/AdminAuthBanner';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { ConfirmDeleteModal } from '../../components/pizzariatop/ConfirmDeleteModal';
import {
  INGREDIENTE_TIPOS,
  IngredienteFormModal,
} from '../../components/pizzariatop/IngredienteFormModal';

type FilterTipo = 'todos' | IngredienteTipo | 'doces_outros';
type IngredienteSortMode = 'por_tipo' | 'az' | 'menor_preco';

interface TipoVisualTheme {
  label: string;
  emoji: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
  border: string;
  order: number;
}

const TIPO_THEME_MAP: Record<string, TipoVisualTheme> = {
  queijos: {
    label: 'Queijos',
    emoji: '🧀',
    icon: 'disc',
    color: '#FACC15',
    bg: 'rgba(250, 204, 21, 0.16)',
    border: 'rgba(250, 204, 21, 0.45)',
    order: 1,
  },
  carnes: {
    label: 'Carnes',
    emoji: '🥓',
    icon: 'award',
    color: '#FB7185',
    bg: 'rgba(244, 63, 94, 0.16)',
    border: 'rgba(244, 63, 94, 0.45)',
    order: 2,
  },
  vegetais: {
    label: 'Vegetais',
    emoji: '🌿',
    icon: 'feather',
    color: '#34D399',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    order: 3,
  },
  doces: {
    label: 'Doces',
    emoji: '🍫',
    icon: 'heart',
    color: '#F472B6',
    bg: 'rgba(244, 114, 182, 0.16)',
    border: 'rgba(244, 114, 182, 0.45)',
    order: 4,
  },
  frutas: {
    label: 'Frutas',
    emoji: '🍓',
    icon: 'sun',
    color: '#FB923C',
    bg: 'rgba(251, 146, 60, 0.16)',
    border: 'rgba(251, 146, 60, 0.45)',
    order: 5,
  },
  outros: {
    label: 'Outros',
    emoji: '✨',
    icon: 'layers',
    color: '#A78BFA',
    bg: 'rgba(139, 92, 246, 0.16)',
    border: 'rgba(139, 92, 246, 0.45)',
    order: 6,
  },
};

const FILTER_OPTIONS: Array<{ key: FilterTipo; label: string }> = [
  { key: 'todos', label: 'Todos' },
  ...INGREDIENTE_TIPOS,
];

const SORT_OPTIONS: Array<{
  key: IngredienteSortMode;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  { key: 'por_tipo', label: 'Por Tipo', icon: 'grid' },
  { key: 'az', label: 'A-Z', icon: 'type' },
  { key: 'menor_preco', label: 'Menor Preço', icon: 'trending-down' },
];

const HTTP_BADGES: Array<{
  method: string;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    method: 'GET',
    color: PIZZARIA_COLORS.cyan,
    bg: 'rgba(6, 182, 212, 0.14)',
    border: 'rgba(6, 182, 212, 0.36)',
  },
  {
    method: 'POST',
    color: PIZZARIA_COLORS.emerald,
    bg: 'rgba(22, 163, 74, 0.16)',
    border: PIZZARIA_COLORS.basilBorder,
  },
  {
    method: 'PUT',
    color: PIZZARIA_COLORS.gold,
    bg: 'rgba(245, 158, 11, 0.16)',
    border: PIZZARIA_COLORS.goldBorder,
  },
  {
    method: 'DELETE',
    color: '#FCA5A5',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: PIZZARIA_COLORS.errorBorder,
  },
];

function getIngredienteId(item: Ingrediente): number {
  return Number(item.id_ingrediente ?? item.id ?? 0);
}

function isIngredienteDisponivel(item: Ingrediente): boolean {
  if (item.disponivel === undefined || item.disponivel === null) return true;
  return item.disponivel === true || item.disponivel === 1;
}

function getTipoKey(tipo?: string | null): string {
  const key = String(tipo ?? 'outros').trim().toLowerCase();
  return TIPO_THEME_MAP[key] ? key : 'outros';
}

function getTipoTheme(tipo?: string | null): TipoVisualTheme {
  return TIPO_THEME_MAP[getTipoKey(tipo)] ?? TIPO_THEME_MAP.outros;
}

function formatTipoLabel(tipo?: string | null): string {
  return getTipoTheme(tipo).label;
}

export default function IngredientesScreen() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<FilterTipo>('todos');
  const [sortMode, setSortMode] = useState<IngredienteSortMode>('por_tipo');

  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(
    null
  );

  // Modal de criação/edição (POST / PUT)
  const [formVisible, setFormVisible] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Consulta individual GET /ingredientes/:id
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [detailIngrediente, setDetailIngrediente] = useState<Ingrediente | null>(null);

  // Modal de exclusão (DELETE)
  const [deleteTarget, setDeleteTarget] = useState<Ingrediente | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIngredientes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const list = await getIngredientes();
      setIngredientes(list);
      if (isRefresh) {
        setFeedback({
          type: 'info',
          message: `Lista atualizada via GET /api/ingredientes (${list.length} registro${
            list.length === 1 ? '' : 's'
          }).`,
        });
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Erro ao carregar ingredientes da API.');
      setLoadError(msg);
      if (isRefresh) {
        setFeedback({ type: 'error', message: msg });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredientes(false);
  }, [fetchIngredientes]);

  // Mini-KPIs por categoria (Queijos · Carnes · Vegetais · Doces/Outros)
  const categoryKpis = useMemo(() => {
    let queijos = 0;
    let carnes = 0;
    let vegetais = 0;
    let docesOutros = 0;
    for (const item of ingredientes) {
      const key = getTipoKey(item.tipo_ingrediente);
      if (key === 'queijos') queijos += 1;
      else if (key === 'carnes') carnes += 1;
      else if (key === 'vegetais') vegetais += 1;
      else docesOutros += 1;
    }
    return { queijos, carnes, vegetais, docesOutros };
  }, [ingredientes]);

  const filteredIngredientes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = ingredientes.filter((item) => {
      const tipo = getTipoKey(item.tipo_ingrediente);
      if (selectedTipo === 'doces_outros') {
        if (tipo === 'queijos' || tipo === 'carnes' || tipo === 'vegetais') {
          return false;
        }
      } else if (selectedTipo !== 'todos' && tipo !== selectedTipo) {
        return false;
      }
      if (!query) return true;
      const nome = String(item.nome_ingrediente ?? '').toLowerCase();
      const tipoLabel = formatTipoLabel(tipo).toLowerCase();
      return nome.includes(query) || tipo.includes(query) || tipoLabel.includes(query);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortMode === 'az') {
        return String(a.nome_ingrediente ?? '').localeCompare(
          String(b.nome_ingrediente ?? ''),
          'pt-BR',
          { sensitivity: 'base' }
        );
      }
      if (sortMode === 'menor_preco') {
        const pa = Number(a.preco_adicional ?? 0);
        const pb = Number(b.preco_adicional ?? 0);
        if (pa !== pb) return pa - pb;
        return String(a.nome_ingrediente ?? '').localeCompare(
          String(b.nome_ingrediente ?? ''),
          'pt-BR',
          { sensitivity: 'base' }
        );
      }
      // 'por_tipo'
      const ta = getTipoTheme(a.tipo_ingrediente).order;
      const tb = getTipoTheme(b.tipo_ingrediente).order;
      if (ta !== tb) return ta - tb;
      return String(a.nome_ingrediente ?? '').localeCompare(
        String(b.nome_ingrediente ?? ''),
        'pt-BR',
        { sensitivity: 'base' }
      );
    });

    return sorted;
  }, [ingredientes, searchQuery, selectedTipo, sortMode]);

  const openCreateModal = () => {
    setEditingIngrediente(null);
    setFormError(null);
    setFormVisible(true);
  };

  const handleOpenEdit = async (item: Ingrediente) => {
    const id = getIngredienteId(item);
    setFetchingId(id);
    setFormError(null);
    try {
      const fresh = await getIngredienteById(id);
      setEditingIngrediente(fresh);
      setFormVisible(true);
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        `Não foi possível consultar o ingrediente #${id} (GET /ingredientes/${id}).`
      );
      setFeedback({ type: 'error', message: msg });
      setEditingIngrediente(item);
      setFormVisible(true);
    } finally {
      setFetchingId(null);
    }
  };

  const handleOpenDetails = async (item: Ingrediente) => {
    const id = getIngredienteId(item);
    setFetchingId(id);
    try {
      const fresh = await getIngredienteById(id);
      setDetailIngrediente(fresh);
      setFeedback({
        type: 'info',
        message: `Consulta individual concluída: GET /api/ingredientes/${id}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(
          err,
          `Falha ao consultar detalhes do ingrediente #${id}.`
        ),
      });
    } finally {
      setFetchingId(null);
    }
  };

  const handleFormSubmit = async (payload: IngredientePayload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingIngrediente) {
        const id = getIngredienteId(editingIngrediente);
        await updateIngrediente(id, payload);
        setFormVisible(false);
        setEditingIngrediente(null);
        setFeedback({
          type: 'success',
          message: `Ingrediente "${payload.nome_ingrediente}" atualizado com sucesso (PUT /api/ingredientes/${id}).`,
        });
      } else {
        await createIngrediente(payload);
        setFormVisible(false);
        setFeedback({
          type: 'success',
          message: `Ingrediente "${payload.nome_ingrediente}" cadastrado com sucesso (POST /api/ingredientes).`,
        });
      }
      await fetchIngredientes(false);
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        editingIngrediente
          ? 'Erro ao atualizar ingrediente na API.'
          : 'Erro ao cadastrar ingrediente na API.'
      );
      setFormError(msg);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = getIngredienteId(deleteTarget);
    const nome = deleteTarget.nome_ingrediente;
    setDeleting(true);
    try {
      const res = await deleteIngrediente(id);
      const serverMsg =
        typeof res?.message === 'string' && res.message.trim().length > 0
          ? res.message.trim()
          : '';
      const isSoftDelete =
        Boolean(res?.softDeleted || res?.soft_deleted || res?.desativado) ||
        /indispon|desativ|soft|vincu|fk|chave/i.test(serverMsg);

      setDeleteTarget(null);
      setFeedback({
        type: 'success',
        message: isSoftDelete
          ? `Ingrediente "${nome}" marcado como indisponível (soft-delete por vínculo no banco). ${
              serverMsg ? `Detalhes: ${serverMsg}` : ''
            }`.trim()
          : serverMsg
          ? `${serverMsg} (DELETE /api/ingredientes/${id}).`
          : `Ingrediente "${nome}" excluído com sucesso (DELETE /api/ingredientes/${id}).`,
      });
      await fetchIngredientes(false);
    } catch (err) {
      const msg = extractErrorMessage(err, `Erro ao excluir ingrediente #${id}.`);
      setDeleteTarget(null);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setDeleting(false);
    }
  };

  const disponiveisCount = useMemo(
    () => ingredientes.filter((item) => isIngredienteDisponivel(item)).length,
    [ingredientes]
  );

  return (
    <PizzariaTopShell
      activeTab="ingredientes"
      subtitle="Tela 2 · /api/ingredientes (Axios)"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchIngredientes(true)}
            tintColor={PIZZARIA_COLORS.gold}
            colors={[PIZZARIA_COLORS.fireOrange, PIZZARIA_COLORS.gold]}
          />
        }
      >
        <View style={styles.maxWidthWrap}>
          {/* Hero artesanal da Tela 2 */}
          <View style={styles.heroCard}>
            <View style={styles.heroFireStripe} />
            <View style={styles.heroGlowAccent} />
            <View style={styles.heroBody}>
              <View style={styles.heroBadge}>
                <Feather name="layers" size={12} color={PIZZARIA_COLORS.gold} />
                <Text style={styles.heroBadgeText}>
                  TELA 2 · /api/ingredientes (AXIOS)
                </Text>
              </View>

              <Text style={styles.heroTitle}>Ingredientes · CRUD</Text>
              <Text style={styles.heroSubtitle}>
                Gerencie os ingredientes artesanais do forno a lenha com categorias
                coloridas, listagem, consulta por ID, cadastro, edição e exclusão via Axios.
              </Text>

              <View style={[styles.httpPillRow, { marginTop: 0, marginBottom: 14 }]}>
                {HTTP_BADGES.map((badge) => (
                  <View
                    key={badge.method}
                    style={[
                      styles.httpPill,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}
                  >
                    <Text style={[styles.httpPillText, { color: badge.color }]}>
                      {badge.method}
                    </Text>
                  </View>
                ))}
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>
                    {disponiveisCount}/{ingredientes.length} disponíveis
                  </Text>
                </View>
              </View>

              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={openCreateModal}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={16} color="#FFF7ED" />
                  <Text style={styles.primaryCtaText}>Novo Ingrediente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => fetchIngredientes(true)}
                  disabled={loading || refreshing}
                  activeOpacity={0.8}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                  ) : (
                    <Feather name="refresh-cw" size={14} color={PIZZARIA_COLORS.gold} />
                  )}
                  <Text style={styles.ghostBtnText}>Atualizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Banner de autenticação Admin */}
          <AdminAuthBanner
            onAuthChange={() => {
              if (feedback?.type === 'error') {
                setFeedback(null);
              }
            }}
          />

          {/* Banner de feedback para todas as operações CRUD */}
          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* Barra de Mini-KPIs por Categoria (Queijos · Carnes · Vegetais · Doces/Outros) */}
          <View style={localStyles.kpiGrid}>
            <TouchableOpacity
              style={[
                localStyles.kpiCard,
                selectedTipo === 'queijos' && {
                  borderColor: TIPO_THEME_MAP.queijos.border,
                  backgroundColor: TIPO_THEME_MAP.queijos.bg,
                },
              ]}
              onPress={() =>
                setSelectedTipo((prev) => (prev === 'queijos' ? 'todos' : 'queijos'))
              }
              activeOpacity={0.82}
            >
              <View
                style={[
                  localStyles.kpiIconBox,
                  { backgroundColor: TIPO_THEME_MAP.queijos.bg },
                ]}
              >
                <Text style={localStyles.kpiEmoji}>🧀</Text>
              </View>
              <View>
                <Text
                  style={[
                    localStyles.kpiNumber,
                    { color: TIPO_THEME_MAP.queijos.color },
                  ]}
                >
                  {categoryKpis.queijos}
                </Text>
                <Text style={localStyles.kpiCaption}>Queijos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.kpiCard,
                selectedTipo === 'carnes' && {
                  borderColor: TIPO_THEME_MAP.carnes.border,
                  backgroundColor: TIPO_THEME_MAP.carnes.bg,
                },
              ]}
              onPress={() =>
                setSelectedTipo((prev) => (prev === 'carnes' ? 'todos' : 'carnes'))
              }
              activeOpacity={0.82}
            >
              <View
                style={[
                  localStyles.kpiIconBox,
                  { backgroundColor: TIPO_THEME_MAP.carnes.bg },
                ]}
              >
                <Text style={localStyles.kpiEmoji}>🥓</Text>
              </View>
              <View>
                <Text
                  style={[
                    localStyles.kpiNumber,
                    { color: TIPO_THEME_MAP.carnes.color },
                  ]}
                >
                  {categoryKpis.carnes}
                </Text>
                <Text style={localStyles.kpiCaption}>Carnes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.kpiCard,
                selectedTipo === 'vegetais' && {
                  borderColor: TIPO_THEME_MAP.vegetais.border,
                  backgroundColor: TIPO_THEME_MAP.vegetais.bg,
                },
              ]}
              onPress={() =>
                setSelectedTipo((prev) => (prev === 'vegetais' ? 'todos' : 'vegetais'))
              }
              activeOpacity={0.82}
            >
              <View
                style={[
                  localStyles.kpiIconBox,
                  { backgroundColor: TIPO_THEME_MAP.vegetais.bg },
                ]}
              >
                <Text style={localStyles.kpiEmoji}>🌿</Text>
              </View>
              <View>
                <Text
                  style={[
                    localStyles.kpiNumber,
                    { color: TIPO_THEME_MAP.vegetais.color },
                  ]}
                >
                  {categoryKpis.vegetais}
                </Text>
                <Text style={localStyles.kpiCaption}>Vegetais</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.kpiCard,
                selectedTipo === 'doces_outros' && {
                  borderColor: TIPO_THEME_MAP.doces.border,
                  backgroundColor: TIPO_THEME_MAP.doces.bg,
                },
              ]}
              onPress={() =>
                setSelectedTipo((prev) =>
                  prev === 'doces_outros' ? 'todos' : 'doces_outros'
                )
              }
              activeOpacity={0.82}
            >
              <View
                style={[
                  localStyles.kpiIconBox,
                  { backgroundColor: TIPO_THEME_MAP.doces.bg },
                ]}
              >
                <Text style={localStyles.kpiEmoji}>🍫</Text>
              </View>
              <View>
                <Text
                  style={[
                    localStyles.kpiNumber,
                    { color: TIPO_THEME_MAP.doces.color },
                  ]}
                >
                  {categoryKpis.docesOutros}
                </Text>
                <Text style={localStyles.kpiCaption}>Doces/Outros</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Barra de busca textual por nome/tipo */}
          <View style={styles.searchBarWrap}>
            <Feather name="search" size={16} color={PIZZARIA_COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome ou tipo (ex.: queijo, bacon, rúcula)..."
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
                accessibilityLabel="Limpar busca"
              >
                <Feather name="x-circle" size={16} color={PIZZARIA_COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Chips de filtro por tipo_ingrediente */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            {FILTER_OPTIONS.map((option) => {
              const active = selectedTipo === option.key;
              const optTheme =
                option.key !== 'todos' ? getTipoTheme(option.key) : null;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                    active &&
                      optTheme && {
                        backgroundColor: optTheme.bg,
                        borderColor: optTheme.color,
                      },
                  ]}
                  onPress={() => setSelectedTipo(option.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                      active && optTheme && { color: optTheme.color },
                    ]}
                  >
                    {optTheme ? `${optTheme.emoji} ${option.label}` : option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Chips de Ordenação (Por Tipo · A-Z · Menor Preço) */}
          <View style={localStyles.sortRow}>
            <View style={localStyles.sortTitleWrap}>
              <Feather name="sliders" size={13} color={PIZZARIA_COLORS.gold} />
              <Text style={localStyles.sortTitleText}>Ordenar:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.sortScrollContent}
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sortMode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[localStyles.sortPill, active && localStyles.sortPillActive]}
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
                        localStyles.sortPillText,
                        active && localStyles.sortPillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Cabeçalho da listagem + contador */}
          <View style={styles.crudHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Catálogo de Ingredientes</Text>
            </View>
            <View style={styles.crudCountBadge}>
              <Text style={styles.crudCountText}>
                {filteredIngredientes.length} de {ingredientes.length}
              </Text>
            </View>
          </View>

          {/* Estados de carga, erro e listagem */}
          {loading && ingredientes.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PIZZARIA_COLORS.fireOrange} />
              <Text
                style={[
                  styles.itemDesc,
                  { marginTop: 12, color: PIZZARIA_COLORS.textSecondary },
                ]}
              >
                Carregando ingredientes via GET /api/ingredientes...
              </Text>
            </View>
          ) : loadError && ingredientes.length === 0 ? (
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
                onPress={() => fetchIngredientes(false)}
                activeOpacity={0.85}
              >
                <Feather name="rotate-cw" size={14} color="#FFF7ED" />
                <Text style={styles.primaryCtaText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filteredIngredientes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconBox}>
                <Feather name="layers" size={22} color={PIZZARIA_COLORS.gold} />
              </View>
              <Text style={styles.emptyStateTitle}>
                {ingredientes.length === 0
                  ? 'Nenhum ingrediente cadastrado'
                  : 'Nenhum ingrediente encontrado'}
              </Text>
              <Text style={styles.emptyStateDesc}>
                {ingredientes.length === 0
                  ? 'Clique em "Novo Ingrediente" para adicionar o primeiro item na API.'
                  : 'Tente ajustar o termo de busca ou selecionar outro filtro de tipo.'}
              </Text>
              {(searchQuery.length > 0 || selectedTipo !== 'todos') && (
                <TouchableOpacity
                  style={[styles.ghostBtn, { marginTop: 14 }]}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedTipo('todos');
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="filter" size={14} color={PIZZARIA_COLORS.gold} />
                  <Text style={styles.ghostBtnText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredIngredientes.map((item) => {
              const id = getIngredienteId(item);
              const disponivel = isIngredienteDisponivel(item);
              const imageUri = resolveImageUrl(item.imagem_url);
              const isFetchingThis = fetchingId === id;
              const theme = getTipoTheme(item.tipo_ingrediente);

              return (
                <View
                  key={`ingrediente-${id}-${item.nome_ingrediente}`}
                  style={[
                    styles.crudCard,
                    { borderLeftWidth: 3.5, borderLeftColor: theme.color },
                  ]}
                >
                  <View style={styles.menuItemRow}>
                    <View
                      style={[
                        styles.menuThumb,
                        {
                          width: 60,
                          height: 60,
                          borderRadius: 18,
                          backgroundColor: theme.bg,
                          borderColor: theme.border,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.menuThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18, lineHeight: 22 }}>{theme.emoji}</Text>
                          <Feather
                            name={theme.icon}
                            size={12}
                            color={theme.color}
                            style={{ marginTop: 2 }}
                          />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.crudCardHeader}>
                        <Text style={[styles.itemTitle, { flex: 1, marginBottom: 0 }]}>
                          {item.nome_ingrediente}
                        </Text>
                        <Text style={styles.priceText}>
                          +{formatCurrency(item.preco_adicional)}
                        </Text>
                      </View>

                      <View style={styles.crudMetaRow}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>#{id}</Text>
                        </View>

                        <View
                          style={[
                            styles.tagPill,
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              backgroundColor: theme.bg,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Feather name={theme.icon} size={11} color={theme.color} />
                          <Text style={[styles.tagPillText, { color: theme.color }]}>
                            {theme.emoji} {theme.label}
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
                              {
                                color: disponivel
                                  ? PIZZARIA_COLORS.emerald
                                  : '#FCA5A5',
                              },
                            ]}
                          >
                            {disponivel ? 'Disponível' : 'Indisponível'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.crudCardFooter}>
                    <TouchableOpacity
                      style={[
                        styles.ghostBtn,
                        { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
                      ]}
                      onPress={() => handleOpenDetails(item)}
                      disabled={isFetchingThis}
                      activeOpacity={0.8}
                    >
                      {isFetchingThis ? (
                        <ActivityIndicator size="small" color={PIZZARIA_COLORS.cyan} />
                      ) : (
                        <Feather name="eye" size={13} color={PIZZARIA_COLORS.cyan} />
                      )}
                      <Text style={[styles.ghostBtnText, { fontSize: 12 }]}>
                        GET /:id
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.crudActionsRow}>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() => handleOpenEdit(item)}
                        disabled={isFetchingThis}
                        activeOpacity={0.8}
                      >
                        {isFetchingThis ? (
                          <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                        ) : (
                          <Feather name="edit-2" size={13} color={PIZZARIA_COLORS.gold} />
                        )}
                        <Text style={styles.editActionText}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => setDeleteTarget(item)}
                        disabled={isFetchingThis}
                        activeOpacity={0.8}
                      >
                        <Feather name="trash-2" size={13} color="#FCA5A5" />
                        <Text style={styles.deleteActionText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de detalhes individuais (GET /api/ingredientes/:id) */}
      <Modal
        visible={Boolean(detailIngrediente)}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailIngrediente(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailIngrediente(null)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {detailIngrediente ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.rowGap, { marginBottom: 4 }]}>
                      <View
                        style={[
                          styles.httpPill,
                          {
                            backgroundColor: 'rgba(6, 182, 212, 0.14)',
                            borderColor: 'rgba(6, 182, 212, 0.36)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.httpPillText,
                            { color: PIZZARIA_COLORS.cyan },
                          ]}
                        >
                          GET /ingredientes/{getIngredienteId(detailIngrediente)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modalTitle}>
                      {getTipoTheme(detailIngrediente.tipo_ingrediente).emoji}{' '}
                      {detailIngrediente.nome_ingrediente}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Registro consultado individualmente na API
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setDetailIngrediente(null)}
                    activeOpacity={0.75}
                  >
                    <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.crudMetaRow}>
                    {(() => {
                      const detailTheme = getTipoTheme(detailIngrediente.tipo_ingrediente);
                      return (
                        <View
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: detailTheme.bg,
                              borderColor: detailTheme.border,
                            },
                          ]}
                        >
                          <Text style={[styles.tagPillText, { color: detailTheme.color }]}>
                            {detailTheme.emoji} {detailTheme.label}
                          </Text>
                        </View>
                      );
                    })()}
                    <View style={styles.tagPill}>
                      <Text style={[styles.tagPillText, { color: PIZZARIA_COLORS.gold }]}>
                        +{formatCurrency(detailIngrediente.preco_adicional)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.jsonBox}>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(
                        {
                          id_ingrediente: getIngredienteId(detailIngrediente),
                          nome_ingrediente: detailIngrediente.nome_ingrediente,
                          tipo_ingrediente: detailIngrediente.tipo_ingrediente,
                          preco_adicional: formatCurrency(
                            detailIngrediente.preco_adicional
                          ),
                          disponivel: isIngredienteDisponivel(detailIngrediente),
                          imagem_url: detailIngrediente.imagem_url || null,
                        },
                        null,
                        2
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setDetailIngrediente(null)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.modalCancelText}>Fechar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryCtaBtn, { flex: 1.3 }]}
                    onPress={() => {
                      const target = detailIngrediente;
                      setDetailIngrediente(null);
                      setEditingIngrediente(target);
                      setFormError(null);
                      setFormVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="edit-2" size={14} color="#FFF7ED" />
                    <Text style={styles.primaryCtaText}>Editar Ingrediente</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de cadastro/edição (POST / PUT) */}
      <IngredienteFormModal
        visible={formVisible}
        ingrediente={editingIngrediente}
        submitting={formSubmitting}
        errorMessage={formError}
        onClose={() => {
          if (!formSubmitting) {
            setFormVisible(false);
            setFormError(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Modal de confirmação de exclusão (DELETE) */}
      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title="Excluir Ingrediente"
        itemName={deleteTarget?.nome_ingrediente ?? ''}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </PizzariaTopShell>
  );
}

const localStyles = StyleSheet.create({
  kpiGrid: {
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
    paddingHorizontal: 10,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiEmoji: {
    fontSize: 16,
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  kpiCaption: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sortTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortTitleText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  sortScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sortPill: {
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
  sortPillActive: {
    backgroundColor: PIZZARIA_COLORS.gold,
    borderColor: '#FEF08A',
  },
  sortPillText: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '800',
  },
  sortPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
});
