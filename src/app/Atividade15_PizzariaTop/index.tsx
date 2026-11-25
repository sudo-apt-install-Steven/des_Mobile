import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  Avaliacao,
  Ingrediente,
  Sabor,
  extractErrorMessage,
  formatCurrency,
  getAvaliacoesTop,
  getIngredientes,
  getSabores,
  likeAvaliacao,
  resolveImageUrl,
} from '../../services/pizzariatopApi';
import { AdminAuthBanner } from '../../components/pizzariatop/AdminAuthBanner';
import { FeedbackBanner, FeedbackType } from '../../components/pizzariatop/FeedbackBanner';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const CRUD_PILLS: Array<{ method: string; bg: string; border: string; color: string }> = [
  {
    method: 'GET',
    bg: 'rgba(22, 163, 74, 0.18)',
    border: 'rgba(34, 197, 94, 0.4)',
    color: '#86EFAC',
  },
  {
    method: 'POST',
    bg: 'rgba(245, 158, 11, 0.18)',
    border: 'rgba(245, 158, 11, 0.42)',
    color: '#FCD34D',
  },
  {
    method: 'PUT',
    bg: 'rgba(59, 130, 246, 0.18)',
    border: 'rgba(59, 130, 246, 0.42)',
    color: '#93C5FD',
  },
  {
    method: 'DELETE',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.42)',
    color: '#FCA5A5',
  },
];

const QUICK_SHORTCUTS: Array<{
  key: string;
  label: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}> = [
  {
    key: 'montar',
    label: 'Montar Pizza',
    sub: 'POST /calculate',
    icon: 'pie-chart',
    route: '/Atividade15_PizzariaTop/montar',
  },
  {
    key: 'pedidos',
    label: 'Pedidos',
    sub: 'CEP & Tracking',
    icon: 'shopping-bag',
    route: '/Atividade15_PizzariaTop/pedidos',
  },
  {
    key: 'api_map',
    label: 'API Map',
    sub: 'Testador Axios',
    icon: 'terminal',
    route: '/Atividade15_PizzariaTop/api_map',
  },
  {
    key: 'perfil',
    label: 'Conta',
    sub: 'Login & Clube',
    icon: 'user',
    route: '/Atividade15_PizzariaTop/perfil',
  },
];

export default function PizzariaTopInicioScreen() {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const [carregando, setCarregando] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);
  const [likingId, setLikingId] = useState<number | null>(null);

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
      ]);

      const [saboresRes, ingredientesRes, avalRes] = results;

      if (saboresRes.status === 'fulfilled') setSabores(saboresRes.value);
      if (ingredientesRes.status === 'fulfilled') setIngredientes(ingredientesRes.value);
      if (avalRes.status === 'fulfilled') setAvaliacoes(avalRes.value);

      const allRejected = results.every((r) => r.status === 'rejected');
      if (allRejected) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        setErro(extractErrorMessage(firstErr, 'Não foi possível conectar à API PizzariaTop.'));
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

  return (
    <PizzariaTopShell activeTab="inicio" subtitle="Forno a Lenha · API REST CRUD">
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
          {/* Status de Autenticação Admin (Bearer Token) */}
          <AdminAuthBanner onAuthChange={() => carregarVitrine(true)} />

          {/* Banner de Feedback (Sucesso / Erro / Info) */}
          {feedback ? (
            <FeedbackBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* Hero Artesanal PizzariaTop */}
          <View style={styles.heroCard}>
            <View style={styles.heroFireStripe} />
            <View style={styles.heroGlowAccent} />
            <View style={styles.heroBody}>
              <View style={styles.heroBadge}>
                <FontAwesome5 name="fire" size={11} color={PIZZARIA_COLORS.gold} />
                <Text style={styles.heroBadgeText}>ATIVIDADE PRÁTICA · API REST + AXIOS</Text>
              </View>
              <Text style={styles.heroTitle}>Gestão Artesanal PizzariaTop</Text>
              <Text style={styles.heroSubtitle}>
                Consumo completo da API REST em produção com Expo Router e Axios. Gerencie
                Sabores e Ingredientes com operações reais de listagem, cadastro, edição e
                exclusão.
              </Text>
              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.primaryCtaBtn}
                  onPress={() => router.push('/Atividade15_PizzariaTop/sabores')}
                  activeOpacity={0.85}
                >
                  <Feather name="disc" size={15} color="#FFF7ED" />
                  <Text style={styles.primaryCtaText}>Gerenciar Sabores</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.goldCtaBtn}
                  onPress={() => router.push('/Atividade15_PizzariaTop/ingredientes')}
                  activeOpacity={0.85}
                >
                  <Feather name="layers" size={15} color="#1C1410" />
                  <Text style={styles.goldCtaText}>Gerenciar Ingredientes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2 Telas CRUD Obrigatórias */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Telas CRUD Completas (Axios)</Text>
            </View>
            <Text style={styles.sectionMeta}>2 Recursos REST</Text>
          </View>

          {/* Tela 1 — Sabores */}
          <TouchableOpacity
            style={[styles.crudCard, { borderColor: PIZZARIA_COLORS.fireBorder }]}
            onPress={() => router.push('/Atividade15_PizzariaTop/sabores')}
            activeOpacity={0.85}
          >
            <View style={styles.crudCardHeader}>
              <View style={[styles.rowGap, { flex: 1 }]}>
                <View style={styles.brandIconBox}>
                  <FontAwesome5 name="pizza-slice" size={16} color="#FFF7ED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>Tela 1 · Sabores de Pizza</Text>
                  <Text style={styles.itemDesc}>Endpoint: /api/sabores</Text>
                </View>
              </View>
              <View style={styles.crudCountBadge}>
                <Text style={styles.crudCountText}>
                  {carregando ? '...' : `${sabores.length} itens`}
                </Text>
              </View>
            </View>

            <Text style={[styles.itemDesc, { marginBottom: 8 }]}>
              Listagem com filtros por categoria, busca, cadastro de novos sabores, edição parcial
              e exclusão confirmada.
            </Text>

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
              <Text style={styles.couponMetaText}>Abrir tela dedicada de Sabores</Text>
              <Feather name="arrow-right" size={16} color={PIZZARIA_COLORS.gold} />
            </View>
          </TouchableOpacity>

          {/* Tela 2 — Ingredientes */}
          <TouchableOpacity
            style={[styles.crudCard, { borderColor: PIZZARIA_COLORS.goldBorder }]}
            onPress={() => router.push('/Atividade15_PizzariaTop/ingredientes')}
            activeOpacity={0.85}
          >
            <View style={styles.crudCardHeader}>
              <View style={[styles.rowGap, { flex: 1 }]}>
                <View
                  style={[
                    styles.brandIconBox,
                    { backgroundColor: PIZZARIA_COLORS.amber },
                  ]}
                >
                  <Feather name="layers" size={17} color="#1C1410" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>Tela 2 · Ingredientes & Adicionais</Text>
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
              Controle completo de queijos, carnes, vegetais, doces e frutas com preço adicional,
              disponibilidade e exclusão segura.
            </Text>

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
              <Text style={styles.couponMetaText}>Abrir tela dedicada de Ingredientes</Text>
              <Feather name="arrow-right" size={16} color={PIZZARIA_COLORS.gold} />
            </View>
          </TouchableOpacity>

          {/* Atalhos Rápidos Complementares */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.amber }]} />
              <Text style={styles.sectionTitle}>Módulos Complementares</Text>
            </View>
            <Text style={styles.sectionMeta}>Expo Router</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            style={{ marginBottom: 14 }}
          >
            {QUICK_SHORTCUTS.map((sc) => (
              <TouchableOpacity
                key={sc.key}
                style={[styles.glassCard, { width: 146, marginBottom: 0, padding: 13 }]}
                onPress={() => router.push(sc.route as any)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.emptyStateIconBox,
                    { width: 36, height: 36, borderRadius: 11, marginBottom: 9 },
                  ]}
                >
                  <Feather name={sc.icon} size={16} color={PIZZARIA_COLORS.gold} />
                </View>
                <Text style={[styles.itemTitle, { fontSize: 13.5 }]} numberOfLines={1}>
                  {sc.label}
                </Text>
                <Text style={[styles.itemDesc, { fontSize: 11 }]} numberOfLines={1}>
                  {sc.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Vitrine ao Vivo via Axios */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.emerald }]} />
              <Text style={styles.sectionTitle}>Vitrine ao Vivo (API)</Text>
            </View>
            <TouchableOpacity
              style={styles.rowGap}
              onPress={() => carregarVitrine(true)}
              activeOpacity={0.75}
            >
              <Feather name="refresh-cw" size={13} color={PIZZARIA_COLORS.gold} />
              <Text style={styles.couponMetaText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PIZZARIA_COLORS.fireOrange} />
              <Text style={[styles.itemDesc, { marginTop: 10 }]}>
                Sincronizando dados em tempo real da API PizzariaTop...
              </Text>
            </View>
          ) : erro !== '' ? (
            <View style={styles.errorCard}>
              <Feather
                name="wifi-off"
                size={24}
                color="#FCA5A5"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.errorText}>{erro}</Text>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={() => carregarVitrine(false)}
                activeOpacity={0.85}
              >
                <Feather name="refresh-cw" size={14} color="#FFF7ED" />
                <Text style={styles.primaryCtaText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Contadores reais da API */}
              <View style={[styles.rowGap, { marginBottom: 14 }]}>
                <View style={[styles.glassCard, { flex: 1, marginBottom: 0, alignItems: 'center' }]}>
                  <Text style={[styles.priceText, { fontSize: 20 }]}>{sabores.length}</Text>
                  <Text style={styles.sectionMeta}>Sabores</Text>
                </View>
                <View style={[styles.glassCard, { flex: 1, marginBottom: 0, alignItems: 'center' }]}>
                  <Text style={[styles.priceText, { fontSize: 20 }]}>{ingredientes.length}</Text>
                  <Text style={styles.sectionMeta}>Ingredientes</Text>
                </View>
                <View style={[styles.glassCard, { flex: 1, marginBottom: 0, alignItems: 'center' }]}>
                  <Text style={[styles.priceText, { fontSize: 20 }]}>{avaliacoes.length}</Text>
                  <Text style={styles.sectionMeta}>Avaliações</Text>
                </View>
              </View>

              {/* Top Sabores da API */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Sabores em Destaque</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/Atividade15_PizzariaTop/sabores')}>
                  <Text style={styles.couponMetaText}>Ver todos →</Text>
                </TouchableOpacity>
              </View>

              {sabores.length === 0 ? (
                <View style={styles.glassCard}>
                  <Text style={styles.itemDesc}>Nenhum sabor retornado pela API.</Text>
                </View>
              ) : (
                sabores.slice(0, 4).map((sabor, idx) => {
                  const imgUri = resolveImageUrl(sabor.imagem_url);
                  return (
                    <View
                      key={`sabor-home-${sabor.id_sabor ?? sabor.id ?? idx}`}
                      style={styles.glassCard}
                    >
                      <View style={styles.menuItemRow}>
                        <View style={styles.menuThumb}>
                          {imgUri ? (
                            <Image
                              source={{ uri: imgUri }}
                              style={styles.menuThumbImg}
                              resizeMode="cover"
                            />
                          ) : (
                            <FontAwesome5
                              name="pizza-slice"
                              size={20}
                              color={PIZZARIA_COLORS.fireOrange}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                            <Text style={[styles.itemTitle, { flex: 1 }]} numberOfLines={1}>
                              {sabor.nome_sabor}
                            </Text>
                            {sabor.categoria_sabor ? (
                              <View style={styles.tagPill}>
                                <Text style={styles.tagPillText}>{sabor.categoria_sabor}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.itemDesc} numberOfLines={2}>
                            {sabor.descricao || 'Receita artesanal assada no forno a lenha.'}
                          </Text>
                          {Number(sabor.preco_adicional ?? 0) > 0 ? (
                            <Text style={[styles.couponMetaText, { marginTop: 4 }]}>
                              Adicional: +{formatCurrency(sabor.preco_adicional)}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Avaliações Top */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.emerald }]} />
                  <Text style={styles.sectionTitle}>Top Avaliações</Text>
                </View>
                <Text style={styles.sectionMeta}>{avaliacoes.length} destaque(s)</Text>
              </View>

              {avaliacoes.length === 0 ? (
                <View style={styles.glassCard}>
                  <Text style={styles.itemDesc}>Nenhuma avaliação em destaque no momento.</Text>
                </View>
              ) : (
                avaliacoes.map((av, idx) => {
                  const avId = av.id_pedido ?? av.id ?? idx;
                  const rating = Math.max(1, Math.min(5, Number(av.avaliacao ?? 5)));
                  return (
                    <View key={`av-${avId}`} style={styles.glassCard}>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={styles.itemTitle}>
                          {av.nome_cliente ?? av.nome ?? 'Cliente PizzariaTop'}
                        </Text>
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
                      <Text style={[styles.itemDesc, { marginBottom: 10 }]}>
                        {av.comentario_avaliacao ?? av.comentario ?? 'Pizza excelente!'}
                      </Text>
                      <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                        <Text style={styles.sectionMeta}>
                          Pedido #{av.id_pedido ?? av.id ?? '-'}
                        </Text>
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
            </>
          )}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}
