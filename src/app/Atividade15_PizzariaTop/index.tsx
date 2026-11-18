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
  Combo,
  Cupom,
  Produto,
  Sabor,
  extractErrorMessage,
  formatCurrency,
  getAvaliacoesTop,
  getCombos,
  getCupons,
  getProdutos,
  getSabores,
  likeAvaliacao,
  resolveImageUrl,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

export default function PizzariaTopInicioScreen() {
  const { addToCart } = usePizzariaTop();

  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const [carregando, setCarregando] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
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
        getCupons(),
        getCombos(),
        getSabores(true),
        getProdutos(true),
        getAvaliacoesTop(),
      ]);

      const [cuponsRes, combosRes, saboresRes, produtosRes, avalRes] = results;

      if (cuponsRes.status === 'fulfilled') setCupons(cuponsRes.value);
      if (combosRes.status === 'fulfilled') setCombos(combosRes.value);
      if (saboresRes.status === 'fulfilled') setSabores(saboresRes.value);
      if (produtosRes.status === 'fulfilled') setProdutos(produtosRes.value);
      if (avalRes.status === 'fulfilled') setAvaliacoes(avalRes.value);

      const allRejected = results.every((r) => r.status === 'rejected');
      if (allRejected) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        setErro(extractErrorMessage(firstErr, 'Não foi possível carregar a vitrine da PizzariaTop.'));
      }
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao carregar dados da PizzariaTop.'));
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
    } catch (e) {
      setFeedback(extractErrorMessage(e, 'Não foi possível curtir a avaliação.'));
    } finally {
      setLikingId(null);
    }
  };

  const handleAddCombo = (combo: Combo) => {
    const id = Number(combo.id_combo ?? combo.id ?? Date.now());
    const preco = Number(combo.preco_combo ?? combo.preco ?? 49.9);
    const nome = combo.nome_combo ?? combo.nome ?? 'Combo PizzariaTop';
    addToCart({
      id_produto: id,
      tipo_item: 'combo',
      nome,
      detalhes: combo.descricao ?? 'Combo promocional',
      quantidade: 1,
      preco_unitario: preco,
    });
    setFeedback(`"${nome}" adicionado ao carrinho!`);
  };

  const handleAddProduto = (prod: Produto) => {
    const id = Number(prod.id_produto ?? prod.id ?? Date.now());
    const preco = Number(prod.preco_base ?? 39.9);
    addToCart({
      id_produto: id,
      tipo_item: 'produto',
      nome: prod.nome_produto,
      detalhes: prod.descricao ?? 'Cardápio PizzariaTop',
      quantidade: 1,
      preco_unitario: preco,
    });
    setFeedback(`"${prod.nome_produto}" adicionado ao carrinho!`);
  };

  return (
    <PizzariaTopShell activeTab="inicio" subtitle="Vitrine & Promoções (Axios)">
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
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroFireStripe} />
            <View style={styles.heroGlowAccent} />
            <View style={styles.heroBody}>
              <View style={styles.heroBadge}>
                <FontAwesome5 name="fire" size={11} color={PIZZARIA_COLORS.gold} />
                <Text style={styles.heroBadgeText}>ATIVIDADE 15 · PIZZARIATOP API</Text>
              </View>
              <Text style={styles.heroTitle}>Sabor artesanal direto do forno a lenha</Text>
              <Text style={styles.heroSubtitle}>
                Monte sua pizza personalizada em etapas, aplique cupons exclusivos, acumule TopCoins e acompanhe seu pedido em tempo real via Axios.
              </Text>
              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.goldCtaBtn}
                  onPress={() => router.replace('/Atividade15_PizzariaTop/montar')}
                  activeOpacity={0.85}
                >
                  <FontAwesome5 name="pizza-slice" size={14} color="#111827" />
                  <Text style={styles.goldCtaText}>Montar Pizza</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={() => router.replace('/Atividade15_PizzariaTop/api_map')}
                  activeOpacity={0.8}
                >
                  <Feather name="terminal" size={14} color="#FFFFFF" />
                  <Text style={styles.ghostBtnText}>API Map & Tester</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {feedback !== '' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{feedback}</Text>
            </View>
          )}

          {carregando && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PIZZARIA_COLORS.fireOrange} />
              <Text style={[styles.itemDesc, { marginTop: 10 }]}>
                Carregando cardápio, cupons e avaliações...
              </Text>
            </View>
          )}

          {erro !== '' && !carregando && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{erro}</Text>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={() => carregarVitrine(false)}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                <Text style={styles.primaryCtaText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!carregando && erro === '' && (
            <>
              {/* Cupons */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.gold }]} />
                  <Text style={styles.sectionTitle}>Cupons Disponíveis</Text>
                </View>
                <Text style={styles.sectionMeta}>{cupons.length} ativo(s)</Text>
              </View>

              {cupons.length === 0 ? (
                <View style={styles.glassCard}>
                  <Text style={styles.itemDesc}>Nenhum cupom cadastrado no momento.</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  style={{ marginBottom: 14 }}
                >
                  {cupons.map((cupom, idx) => {
                    const valorLabel =
                      cupom.tipo_desconto === 'percentual'
                        ? `${cupom.valor_desconto}% OFF`
                        : `${formatCurrency(cupom.valor_desconto)} OFF`;
                    return (
                      <View
                        key={`cupom-${cupom.id_cupom ?? cupom.id ?? idx}`}
                        style={styles.couponCard}
                      >
                        <View style={styles.couponCodeBadge}>
                          <Text style={styles.couponCodeText}>{cupom.codigo}</Text>
                        </View>
                        <Text style={styles.couponDiscountText}>{valorLabel}</Text>
                        <Text style={styles.couponMetaText} numberOfLines={2}>
                          {cupom.descricao ||
                            (cupom.data_validade
                              ? `Válido até ${String(cupom.data_validade).slice(0, 10)}`
                              : 'Use na tela de Pedidos')}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Combos */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Combos Especiais</Text>
                </View>
                <Text style={styles.sectionMeta}>{combos.length} combo(s)</Text>
              </View>

              {combos.length === 0 ? (
                <View style={styles.glassCard}>
                  <Text style={styles.itemDesc}>Nenhum combo ativo no momento.</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  style={{ marginBottom: 14 }}
                >
                  {combos.map((combo, idx) => (
                    <View
                      key={`combo-${combo.id_combo ?? combo.id ?? idx}`}
                      style={styles.comboCard}
                    >
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {combo.nome_combo ?? combo.nome ?? 'Combo Especial'}
                      </Text>
                      <Text style={[styles.itemDesc, { minHeight: 34, marginBottom: 10 }]} numberOfLines={2}>
                        {combo.descricao || 'Pizza + bebida com desconto especial.'}
                      </Text>
                      <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                        <Text style={styles.priceText}>
                          {formatCurrency(combo.preco_combo ?? combo.preco)}
                        </Text>
                        <TouchableOpacity
                          style={[styles.primaryCtaBtn, { paddingHorizontal: 12, paddingVertical: 7 }]}
                          onPress={() => handleAddCombo(combo)}
                          activeOpacity={0.8}
                        >
                          <Feather name="plus" size={13} color="#FFFFFF" />
                          <Text style={[styles.primaryCtaText, { fontSize: 12 }]}>Adicionar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Produtos Showcase */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Cardápio em Destaque</Text>
                </View>
                <Text style={styles.sectionMeta}>{produtos.length} itens</Text>
              </View>

              {produtos.slice(0, 6).map((prod, idx) => {
                const imgUri = resolveImageUrl(prod.imagem_url);
                return (
                  <View
                    key={`prod-${prod.id_produto ?? prod.id ?? idx}`}
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
                          <FontAwesome5 name="pizza-slice" size={22} color={PIZZARIA_COLORS.fireOrange} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {prod.nome_produto}
                        </Text>
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {prod.descricao || 'Preparada na hora com ingredientes selecionados.'}
                        </Text>
                        <View style={[styles.rowGap, { justifyContent: 'space-between', marginTop: 8 }]}>
                          <Text style={styles.priceText}>{formatCurrency(prod.preco_base)}</Text>
                          <TouchableOpacity
                            style={[styles.primaryCtaBtn, { paddingHorizontal: 12, paddingVertical: 7 }]}
                            onPress={() => handleAddProduto(prod)}
                            activeOpacity={0.8}
                          >
                            <Feather name="shopping-cart" size={12} color="#FFFFFF" />
                            <Text style={[styles.primaryCtaText, { fontSize: 12 }]}>Pedir</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Sabores */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.amber }]} />
                  <Text style={styles.sectionTitle}>Sabores de Pizza</Text>
                </View>
                <Text style={styles.sectionMeta}>{sabores.length} sabores</Text>
              </View>

              {sabores.slice(0, 6).map((sabor, idx) => {
                const imgUri = resolveImageUrl(sabor.imagem_url);
                return (
                  <View
                    key={`sabor-${sabor.id_sabor ?? sabor.id ?? idx}`}
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
                          <Feather name="disc" size={22} color={PIZZARIA_COLORS.gold} />
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
                          {sabor.descricao || 'Disponível para montagem personalizada.'}
                        </Text>
                        {Number(sabor.preco_adicional ?? 0) > 0 && (
                          <Text style={[styles.couponMetaText, { marginTop: 4 }]}>
                            Adicional: +{formatCurrency(sabor.preco_adicional)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

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
                  <Text style={styles.itemDesc}>Nenhuma avaliação em destaque ainda.</Text>
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
