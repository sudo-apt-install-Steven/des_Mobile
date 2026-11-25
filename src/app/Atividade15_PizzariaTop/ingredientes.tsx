import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
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

type FilterTipo = 'todos' | IngredienteTipo;

const FILTER_OPTIONS: Array<{ key: FilterTipo; label: string }> = [
  { key: 'todos', label: 'Todos' },
  ...INGREDIENTE_TIPOS,
];

const TIPO_LABEL_MAP: Record<string, string> = {
  queijos: 'Queijos',
  carnes: 'Carnes',
  vegetais: 'Vegetais',
  doces: 'Doces',
  frutas: 'Frutas',
  outros: 'Outros',
};

const TIPO_ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  queijos: 'disc',
  carnes: 'award',
  vegetais: 'feather',
  doces: 'heart',
  frutas: 'sun',
  outros: 'layers',
};

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

function formatTipoLabel(tipo?: string | null): string {
  const key = String(tipo ?? 'outros').toLowerCase();
  return TIPO_LABEL_MAP[key] ?? (tipo || 'Outros');
}

function getTipoIcon(tipo?: string | null): keyof typeof Feather.glyphMap {
  const key = String(tipo ?? 'outros').toLowerCase();
  return TIPO_ICON_MAP[key] ?? 'layers';
}

export default function IngredientesScreen() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<FilterTipo>('todos');

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

  const filteredIngredientes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ingredientes.filter((item) => {
      const tipo = String(item.tipo_ingrediente ?? 'outros').toLowerCase();
      if (selectedTipo !== 'todos' && tipo !== selectedTipo) {
        return false;
      }
      if (!query) return true;
      const nome = String(item.nome_ingrediente ?? '').toLowerCase();
      const tipoLabel = formatTipoLabel(tipo).toLowerCase();
      return nome.includes(query) || tipo.includes(query) || tipoLabel.includes(query);
    });
  }, [ingredientes, searchQuery, selectedTipo]);

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
                Gerencie os ingredientes artesanais do forno a lenha com listagem,
                consulta individual por ID, cadastro, edição e exclusão via Axios.
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
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedTipo(option.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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

              return (
                <View key={`ingrediente-${id}-${item.nome_ingrediente}`} style={styles.crudCard}>
                  <View style={styles.menuItemRow}>
                    <View style={styles.menuThumb}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.menuThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather
                          name={getTipoIcon(item.tipo_ingrediente)}
                          size={22}
                          color={PIZZARIA_COLORS.gold}
                        />
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
                              backgroundColor: 'rgba(234, 88, 12, 0.14)',
                              borderColor: PIZZARIA_COLORS.fireBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagPillText,
                              { color: PIZZARIA_COLORS.gold },
                            ]}
                          >
                            {formatTipoLabel(item.tipo_ingrediente)}
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
