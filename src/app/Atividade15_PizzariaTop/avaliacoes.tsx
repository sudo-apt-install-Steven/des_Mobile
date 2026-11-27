import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import {
  Avaliacao,
  Pedido,
  createAvaliacao,
  extractErrorMessage,
  getAvaliacoes,
  getPedidos,
  likeAvaliacao,
  resolveImageUrl,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { useResponsive } from '../../hooks/useResponsive';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const REVIEW_FILTERS = ['Mais Recentes', 'Melhores Notas', 'Com Fotos'] as const;
type ReviewFilterKey = (typeof REVIEW_FILTERS)[number];

function getReviewPhotoUrl(av: Avaliacao): string | null {
  const raw = av.foto_avaliacao ?? av.foto ?? null;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return resolveImageUrl(trimmed);
}

function getClientAvatarUrl(av: Avaliacao): string | null {
  const raw = av.foto_cliente ?? null;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return resolveImageUrl(trimmed);
}

function getReviewerName(av: Avaliacao): string {
  const candidate = (av.nome_cliente ?? av.nome ?? '').trim();
  return candidate || 'Cliente Pizzaria TOP';
}

function getReviewerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function AvaliacoesScreen() {
  const { width } = useResponsive();
  const { user } = usePizzariaTop();

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<ReviewFilterKey>('Mais Recentes');

  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});
  const [likingId, setLikingId] = useState<number | null>(null);
  const [brokenAvatarKeys, setBrokenAvatarKeys] = useState<Record<string, boolean>>({});
  const [brokenPhotoKeys, setBrokenPhotoKeys] = useState<Record<string, boolean>>({});

  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(
    null
  );

  // Lightbox Modal
  const [lightboxItem, setLightboxItem] = useState<{
    photoUrl: string;
    reviewer: string;
    rating: number;
    comment: string;
  } | null>(null);

  // Create Review Modal
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [pedidosSugeridos, setPedidosSugeridos] = useState<Pedido[]>([]);
  const [idPedidoInput, setIdPedidoInput] = useState<string>('');
  const [notaInput, setNotaInput] = useState<number>(5);
  const [comentarioInput, setComentarioInput] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  const carregarAvaliacoes = useCallback(async (isPull = false) => {
    if (isPull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const lista = await getAvaliacoes(50);
      setAvaliacoes(lista);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Não foi possível carregar as avaliações reais.'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarAvaliacoes(false);
  }, [carregarAvaliacoes]);

  const abrirModalAvaliar = async () => {
    setModalError('');
    setNotaInput(5);
    setComentarioInput('');
    setCreateModalVisible(true);
    try {
      const uid = user?.id_usuario ?? user?.id;
      const listaPedidos = await getPedidos(uid);
      setPedidosSugeridos(listaPedidos.slice(0, 6));
      if (!idPedidoInput && listaPedidos.length > 0) {
        const firstId = listaPedidos[0].id_pedido ?? listaPedidos[0].id;
        if (firstId) setIdPedidoInput(String(firstId));
      }
    } catch {
      // Sugestão de pedidos opcional
    }
  };

  // KPIs oficiais do topo
  const kpis = useMemo(() => {
    const total = avaliacoes.length;
    if (total === 0) {
      return { media: '5.0', total: 0, comFoto: 0 };
    }
    const soma = avaliacoes.reduce((acc, item) => {
      const n = Number(item.avaliacao ?? 5);
      return acc + (Number.isNaN(n) ? 5 : n);
    }, 0);
    const media = (soma / total).toFixed(1);
    const comFoto = avaliacoes.filter((av, idx) => {
      const url = getReviewPhotoUrl(av);
      const key = `${av.id_pedido ?? av.id ?? idx}`;
      return Boolean(url) && !brokenPhotoKeys[key];
    }).length;
    return { media, total, comFoto };
  }, [avaliacoes, brokenPhotoKeys]);

  // Filtro e ordenação
  const avaliacoesExibidas = useMemo(() => {
    const base = [...avaliacoes];
    if (activeFilter === 'Com Fotos') {
      return base.filter((av, idx) => {
        const url = getReviewPhotoUrl(av);
        const key = `${av.id_pedido ?? av.id ?? idx}`;
        return Boolean(url) && !brokenPhotoKeys[key];
      });
    }
    if (activeFilter === 'Melhores Notas') {
      return base.sort((a, b) => {
        const diffNota = Number(b.avaliacao ?? 0) - Number(a.avaliacao ?? 0);
        if (diffNota !== 0) return diffNota;
        return Number(b.likes_avaliacao ?? 0) - Number(a.likes_avaliacao ?? 0);
      });
    }
    // Mais Recentes
    return base.sort((a, b) => {
      const tb = b.data_pedido ? new Date(b.data_pedido).getTime() : 0;
      const ta = a.data_pedido ? new Date(a.data_pedido).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return Number(b.id_pedido ?? b.id ?? 0) - Number(a.id_pedido ?? a.id ?? 0);
    });
  }, [avaliacoes, activeFilter, brokenPhotoKeys]);

  const handleCurtir = async (av: Avaliacao, indexKey: number) => {
    const targetId = Number(av.id_pedido ?? av.id ?? 0);
    if (!targetId) {
      setFeedback({
        type: 'info',
        message: 'Esta avaliação não possui identificador de pedido vinculado para curtida.',
      });
      return;
    }
    if (likingId === targetId) return;

    setLikingId(targetId);
    try {
      await likeAvaliacao(targetId);
      setLikedIds((prev) => ({ ...prev, [targetId]: true }));
      setAvaliacoes((prev) =>
        prev.map((item, i) => {
          const itemId = Number(item.id_pedido ?? item.id ?? -1);
          if (itemId === targetId || i === indexKey) {
            return {
              ...item,
              likes_avaliacao: Number(item.likes_avaliacao ?? 0) + 1,
            };
          }
          return item;
        })
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Erro ao registrar curtida na avaliação.'),
      });
    } finally {
      setLikingId(null);
    }
  };

  const handleEnviarAvaliacao = async () => {
    const parsedPedidoId = Number(idPedidoInput.replace(/\D/g, ''));
    if (!parsedPedidoId || parsedPedidoId <= 0) {
      setModalError('Informe um número de pedido válido (id_pedido).');
      return;
    }
    if (notaInput < 1 || notaInput > 5) {
      setModalError('Selecione uma nota entre 1 e 5 estrelas.');
      return;
    }

    setSubmittingReview(true);
    setModalError('');
    try {
      await createAvaliacao({
        id_pedido: parsedPedidoId,
        avaliacao: notaInput,
        comentario: comentarioInput.trim() || undefined,
      });
      setCreateModalVisible(false);
      setFeedback({
        type: 'success',
        message: `Avaliação ${notaInput}/5 enviada com sucesso para o Pedido #${parsedPedidoId}!`,
      });
      await carregarAvaliacoes(true);
    } catch (err) {
      setModalError(
        extractErrorMessage(
          err,
          'Não foi possível registrar a avaliação. Verifique se o Pedido existe.'
        )
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const isMultiColumn = width >= 768;

  return (
    <PizzariaTopShell
      activeTab="avaliacoes"
      subtitle="Clientes Reais · /api/avaliacoes"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => carregarAvaliacoes(true)}
            tintColor="#F59E0B"
            colors={['#F59E0B']}
          />
        }
      >
        <View style={styles.maxWidthWrap}>
          {/* Cabeçalho Mural + Botão + Avaliar Pedido */}
          <View style={localStyles.headerCard}>
            <View style={localStyles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <View style={localStyles.verifiedHeaderBadge}>
                  <Feather name="award" size={12} color="#F59E0B" />
                  <Text style={localStyles.verifiedHeaderBadgeText}>
                    MURAL DE CLIENTES REAIS
                  </Text>
                </View>
                <Text style={localStyles.headerTitle}>Avaliações da Pizzaria TOP</Text>
                <Text style={localStyles.headerSub}>
                  Notas, fotos reais e depoimentos sincronizados via Axios em GET /api/avaliacoes
                </Text>
              </View>

              <TouchableOpacity
                style={localStyles.newReviewBtn}
                onPress={abrirModalAvaliar}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={16} color="#111827" />
                <Text style={localStyles.newReviewBtnText}>+ Avaliar Pedido</Text>
              </TouchableOpacity>
            </View>

            {/* 3 KPIs Oficiais */}
            <View style={localStyles.kpiGrid}>
              <View style={localStyles.kpiCard}>
                <View style={styles.rowGap}>
                  <FontAwesome name="star" size={18} color="#F59E0B" />
                  <Text style={localStyles.kpiValue}>{kpis.media}/5.0</Text>
                </View>
                <Text style={localStyles.kpiLabel}>Nota Média</Text>
              </View>

              <View style={localStyles.kpiCard}>
                <Text style={[localStyles.kpiValue, { color: '#FACC15' }]}>
                  {kpis.total}+
                </Text>
                <Text style={localStyles.kpiLabel}>Avaliações Reais</Text>
              </View>

              <View style={localStyles.kpiCard}>
                <View style={styles.rowGap}>
                  <Feather name="camera" size={16} color="#10B981" />
                  <Text style={[localStyles.kpiValue, { color: '#34D399' }]}>
                    {kpis.comFoto}
                  </Text>
                </View>
                <Text style={localStyles.kpiLabel}>Com Fotos</Text>
              </View>
            </View>
          </View>

          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* 3 Filtros Pill Oficiais */}
          <View style={localStyles.filterToolbar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.filterRow}
            >
              {REVIEW_FILTERS.map((filtro) => {
                const active = activeFilter === filtro;
                return (
                  <TouchableOpacity
                    key={filtro}
                    style={[
                      localStyles.amberFilterPill,
                      active && localStyles.amberFilterPillActive,
                    ]}
                    onPress={() => setActiveFilter(filtro)}
                    activeOpacity={0.82}
                  >
                    <Feather
                      name={
                        filtro === 'Mais Recentes'
                          ? 'clock'
                          : filtro === 'Melhores Notas'
                          ? 'star'
                          : 'image'
                      }
                      size={13}
                      color={active ? '#111827' : '#F59E0B'}
                    />
                    <Text
                      style={[
                        localStyles.amberFilterPillText,
                        active && localStyles.amberFilterPillTextActive,
                      ]}
                    >
                      {filtro}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={localStyles.refreshMiniBtn}
              onPress={() => carregarAvaliacoes(true)}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={13} color={PIZZARIA_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Listagem de Avaliações */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={[styles.itemDesc, { marginTop: 10 }]}>
                Buscando avaliações reais em GET /api/avaliacoes...
              </Text>
            </View>
          ) : avaliacoesExibidas.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconBox}>
                <Feather name="message-square" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.emptyStateTitle}>
                {activeFilter === 'Com Fotos'
                  ? 'Nenhuma avaliação com foto encontrada'
                  : 'Nenhuma avaliação encontrada'}
              </Text>
              <Text style={styles.emptyStateDesc}>
                {activeFilter === 'Com Fotos'
                  ? 'Altere o filtro para "Mais Recentes" ou seja o primeiro a avaliar um pedido!'
                  : 'Toque em "+ Avaliar Pedido" para enviar sua nota à API PizzariaTop.'}
              </Text>
            </View>
          ) : (
            <View style={isMultiColumn ? localStyles.cardsGridDesktop : undefined}>
              {avaliacoesExibidas.map((av, idx) => {
                const keyId = `${av.id_pedido ?? av.id ?? idx}`;
                const targetPedidoId = Number(av.id_pedido ?? av.id ?? 0);
                const reviewerName = getReviewerName(av);
                const initials = getReviewerInitials(reviewerName);
                const avatarUrl = brokenAvatarKeys[keyId] ? null : getClientAvatarUrl(av);
                const photoUrl = brokenPhotoKeys[keyId] ? null : getReviewPhotoUrl(av);
                const rating = Math.max(1, Math.min(5, Math.round(Number(av.avaliacao ?? 5))));
                const comment =
                  (av.comentario ?? av.comentario_avaliacao ?? '').trim() ||
                  'Pizza quentinha, massa artesanal perfeita e entrega super rápida!';
                const dateFormatted = formatReviewDate(av.data_pedido);
                const likes = Number(av.likes_avaliacao ?? 0);
                const alreadyLiked = Boolean(targetPedidoId && likedIds[targetPedidoId]);

                return (
                  <View
                    key={`rev-${keyId}-${idx}`}
                    style={[
                      localStyles.reviewCard,
                      isMultiColumn && localStyles.reviewCardHalf,
                    ]}
                  >
                    {/* Topo do Card: Avatar + Nome + Compra Verificada + Estrelas */}
                    <View style={localStyles.reviewTopRow}>
                      <View style={[styles.rowGap, { flex: 1 }]}>
                        <View style={localStyles.avatarCircle}>
                          {avatarUrl ? (
                            <Image
                              source={{ uri: avatarUrl }}
                              style={localStyles.avatarImg}
                              onError={() =>
                                setBrokenAvatarKeys((prev) => ({ ...prev, [keyId]: true }))
                              }
                            />
                          ) : (
                            <Text style={localStyles.avatarInitials}>{initials}</Text>
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {reviewerName}
                          </Text>
                          <View style={localStyles.verifiedPillRow}>
                            <View style={localStyles.verifiedSeal}>
                              <Feather name="check-circle" size={11} color="#10B981" />
                              <Text style={localStyles.verifiedSealText}>
                                Compra Verificada
                              </Text>
                            </View>
                            {dateFormatted ? (
                              <Text style={localStyles.reviewDateText}>{dateFormatted}</Text>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <View style={localStyles.starsBadge}>
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <FontAwesome
                            key={`st-${keyId}-${starIdx}`}
                            name={starIdx < rating ? 'star' : 'star-o'}
                            size={13}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>

                    {/* Comentário */}
                    <Text style={localStyles.commentText}>{comment}</Text>

                    {/* Foto Clicável com Lightbox */}
                    {photoUrl ? (
                      <TouchableOpacity
                        style={localStyles.photoPreviewWrap}
                        onPress={() =>
                          setLightboxItem({
                            photoUrl,
                            reviewer: reviewerName,
                            rating,
                            comment,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: photoUrl }}
                          style={localStyles.photoPreviewImg}
                          resizeMode="cover"
                          onError={() =>
                            setBrokenPhotoKeys((prev) => ({ ...prev, [keyId]: true }))
                          }
                        />
                        <View style={localStyles.photoZoomBadge}>
                          <Feather name="maximize-2" size={12} color="#FFFFFF" />
                          <Text style={localStyles.photoZoomText}>Ampliar foto</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Rodapé: Pedido # e Botão Curtir */}
                    <View style={localStyles.reviewFooter}>
                      <Text style={localStyles.orderRefText}>
                        {av.id_pedido ? `Pedido #${av.id_pedido}` : 'Cliente Pizzaria TOP'}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.likeBtn,
                          alreadyLiked && localStyles.likeBtnActive,
                        ]}
                        onPress={() => handleCurtir(av, idx)}
                        disabled={likingId === targetPedidoId}
                        activeOpacity={0.8}
                      >
                        {likingId === targetPedidoId ? (
                          <ActivityIndicator size="small" color="#FCA5A5" />
                        ) : (
                          <>
                            <FontAwesome
                              name={alreadyLiked ? 'heart' : 'heart-o'}
                              size={12}
                              color={alreadyLiked ? '#EF4444' : '#FCA5A5'}
                            />
                            <Text
                              style={[
                                styles.likeBtnText,
                                alreadyLiked && { color: '#FFFFFF' },
                              ]}
                            >
                              Curtir ({likes})
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
      </ScrollView>

      {/* Modal Lightbox de Foto */}
      <Modal
        visible={Boolean(lightboxItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxItem(null)}
      >
        <Pressable
          style={localStyles.lightboxOverlay}
          onPress={() => setLightboxItem(null)}
        >
          <Pressable
            style={localStyles.lightboxCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{lightboxItem?.reviewer}</Text>
                <View style={[styles.starsRow, { marginTop: 4 }]}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FontAwesome
                      key={`lb-star-${i}`}
                      name={i < (lightboxItem?.rating ?? 5) ? 'star' : 'star-o'}
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                  <Text style={[localStyles.verifiedSealText, { marginLeft: 6 }]}>
                    Compra Verificada
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setLightboxItem(null)}
              >
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {lightboxItem?.photoUrl ? (
              <Image
                source={{ uri: lightboxItem.photoUrl }}
                style={localStyles.lightboxImage}
                resizeMode="contain"
              />
            ) : null}

            {lightboxItem?.comment ? (
              <Text style={[localStyles.commentText, { marginTop: 12, marginBottom: 0 }]}>
                &ldquo;{lightboxItem.comment}&rdquo;
              </Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal + Avaliar Pedido (POST /api/avaliacoes) */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!submittingReview) setCreateModalVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!submittingReview) setCreateModalVisible(false);
          }}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Avaliar Pedido</Text>
                <Text style={styles.modalSubtitle}>
                  POST /api/avaliacoes · Envie sua nota e depoimento real
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={submittingReview}
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {modalError ? (
              <FeedbackBanner
                type="error"
                message={modalError}
                onDismiss={() => setModalError('')}
              />
            ) : null}

            <Text style={styles.inputLabel}>Sua Nota (1 a 5 estrelas)</Text>
            <View style={localStyles.ratingSelectorRow}>
              {[1, 2, 3, 4, 5].map((estrela) => {
                const active = estrela <= notaInput;
                return (
                  <TouchableOpacity
                    key={estrela}
                    style={[
                      localStyles.starPickerBtn,
                      estrela === notaInput && localStyles.starPickerBtnSelected,
                    ]}
                    onPress={() => setNotaInput(estrela)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name={active ? 'star' : 'star-o'}
                      size={24}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                );
              })}
              <Text style={localStyles.ratingNumberBadge}>{notaInput}.0 / 5.0</Text>
            </View>

            <Text style={styles.inputLabel}>Número do Pedido (id_pedido)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 12"
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              keyboardType="numeric"
              value={idPedidoInput}
              onChangeText={setIdPedidoInput}
              editable={!submittingReview}
            />

            {pedidosSugeridos.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.sectionMeta, { marginBottom: 6 }]}>
                  Toque para preencher um pedido recente:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {pedidosSugeridos.map((ped, i) => {
                    const pid = ped.id_pedido ?? ped.id ?? i + 1;
                    const selected = idPedidoInput === String(pid);
                    return (
                      <TouchableOpacity
                        key={`ped-chip-${pid}`}
                        style={[
                          styles.filterChip,
                          selected && {
                            backgroundColor: '#F59E0B',
                            borderColor: '#FDE68A',
                          },
                        ]}
                        onPress={() => setIdPedidoInput(String(pid))}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected && { color: '#111827', fontWeight: '900' },
                          ]}
                        >
                          Pedido #{pid}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Comentário sobre sua experiência</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Conte o que achou da massa, recheio e entrega..."
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              multiline
              value={comentarioInput}
              onChangeText={setComentarioInput}
              editable={!submittingReview}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={submittingReview}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.goldCtaBtn,
                  {
                    flex: 1.4,
                    backgroundColor: '#F59E0B',
                    opacity: submittingReview ? 0.7 : 1,
                  },
                ]}
                onPress={handleEnviarAvaliacao}
                disabled={submittingReview}
                activeOpacity={0.85}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <Feather name="send" size={15} color="#111827" />
                    <Text style={styles.goldCtaText}>Publicar Avaliação</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </PizzariaTopShell>
  );
}

const localStyles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#161B26',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.38)',
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      web: { boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.45)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  headerTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  verifiedHeaderBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.42)',
    marginBottom: 8,
  },
  verifiedHeaderBadgeText: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  headerSub: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  newReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  newReviewBtnText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '900',
  },
  kpiLabel: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amberFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  amberFilterPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FDE68A',
  },
  amberFilterPillText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  amberFilterPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  refreshMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reviewCard: {
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    padding: 15,
    marginBottom: 12,
  },
  reviewCardHalf: {
    width: '49%',
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#FDE68A',
    fontSize: 15,
    fontWeight: '900',
  },
  verifiedPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  verifiedSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.42)',
  },
  verifiedSealText: {
    color: '#34D399',
    fontSize: 10.5,
    fontWeight: '800',
  },
  reviewDateText: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
  },
  starsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  commentText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 12,
  },
  photoPreviewWrap: {
    height: 185,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 12,
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  photoZoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  photoZoomText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  orderRefText: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '700',
  },
  likeBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.30)',
    borderColor: '#EF4444',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#151924',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    padding: 16,
  },
  lightboxImage: {
    width: '100%',
    height: 340,
    borderRadius: 14,
    backgroundColor: '#090D16',
  },
  ratingSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  starPickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starPickerBtnSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  ratingNumberBadge: {
    marginLeft: 'auto',
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
});
