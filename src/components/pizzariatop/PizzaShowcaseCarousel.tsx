import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Sabor, formatCurrency } from '../../services/pizzariatopApi';
import { useResponsive } from '../../hooks/useResponsive';
import {
  getPizzaImageSource,
  getPizzaRichDescription,
  normalizePizzaText,
} from '../../utils/pizzaImageMap';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { usePizzariaTop } from './PizzariaTopContext';

export interface PizzaShowcaseCarouselProps {
  sabores: Sabor[];
  loading?: boolean;
  onAddedToCart?: (saborNome: string, tamanhoLabel: string) => void;
}

const FALLBACK_SABORES: Sabor[] = [
  {
    id_sabor: 101,
    nome_sabor: 'Calabresa Especial',
    categoria_sabor: 'tradicional',
    preco_adicional: 0,
    destaque: 1,
    descricao:
      'Molho artesanal de tomates frescos, mussarela derretida, calabresa defumada fatiada, cebola roxa e orégano.',
  },
  {
    id_sabor: 102,
    nome_sabor: 'Frango com Catupiry',
    categoria_sabor: 'especial',
    preco_adicional: 4,
    destaque: 1,
    descricao:
      'Peito de frango desfiado temperado com ervas finas e coberto com generosa camada de Catupiry cremoso.',
  },
  {
    id_sabor: 103,
    nome_sabor: 'Quatro Queijos',
    categoria_sabor: 'premium',
    preco_adicional: 6,
    destaque: 1,
    descricao:
      'Harmonia cremosa de mussarela, provolone defumado, parmesão maturado e requeijão gratinado no forno.',
  },
  {
    id_sabor: 104,
    nome_sabor: 'Pepperoni Artesanal',
    categoria_sabor: 'especial',
    preco_adicional: 5,
    destaque: 1,
    descricao:
      'Fatias crocantes de pepperoni levemente picante sobre mussarela gratinada e molho pelati italiano.',
  },
  {
    id_sabor: 105,
    nome_sabor: 'Carne Seca Nordestina',
    categoria_sabor: 'premium',
    preco_adicional: 8,
    destaque: 1,
    descricao:
      'Carne seca desfiada salteada na manteiga da terra com cebola roxa, mussarela e toque de requeijão.',
  },
  {
    id_sabor: 106,
    nome_sabor: 'Chocolate Branco com Morango',
    categoria_sabor: 'doce',
    preco_adicional: 6,
    destaque: 1,
    descricao:
      'Cobertura cremosa de chocolate branco nobre derretido finalizada com morangos frescos selecionados.',
  },
];

const SIZE_OPTIONS = [
  { key: 'media', label: 'Média (6 fatias)', basePrice: 35 },
  { key: 'grande', label: 'Grande (8 fatias)', basePrice: 45 },
  { key: 'familia', label: 'Família (12 fatias)', basePrice: 55 },
] as const;

const glowShadow = Platform.select({
  web: {
    boxShadow: '0px 0px 32px rgba(250, 204, 21, 0.35)',
  },
  default: {
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});

export function PizzaShowcaseCarousel({
  sabores,
  loading = false,
  onAddedToCart,
}: PizzaShowcaseCarouselProps) {
  const { width } = useResponsive();
  const { addToCart } = usePizzariaTop();

  const isWideLayout = width >= 720;

  const curatedList = useMemo(() => {
    const seen = new Set<string>();
    const filtered = sabores.filter((item) => {
      const norm = normalizePizzaText(item.nome_sabor);
      if (!norm || norm.includes('teste') || norm.includes('test')) return false;
      if (item.disponivel === 0 || item.disponivel === false) return false;
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });

    if (filtered.length === 0) {
      return FALLBACK_SABORES;
    }

    // Prioriza sabores em destaque primeiro, mantendo variedade até 10 slides
    const sorted = [...filtered].sort((a, b) => {
      const da = a.destaque === 1 || a.destaque === true ? 1 : 0;
      const db = b.destaque === 1 || b.destaque === true ? 1 : 0;
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [sabores]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSizeKey, setSelectedSizeKey] = useState<'media' | 'grande' | 'familia'>('grande');
  const [justAddedId, setJustAddedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (currentIndex >= curatedList.length) {
      setCurrentIndex(0);
    }
  }, [curatedList.length, currentIndex]);

  useEffect(() => {
    if (detailsOpen || curatedList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % curatedList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [curatedList.length, detailsOpen]);

  const currentSabor = curatedList[currentIndex] ?? FALLBACK_SABORES[0];
  const extraPrice = Math.max(0, Number(currentSabor.preco_adicional ?? 0) || 0);
  const grandePrice = Number((45 + extraPrice).toFixed(2));
  const selectedSizeObj =
    SIZE_OPTIONS.find((s) => s.key === selectedSizeKey) ?? SIZE_OPTIONS[1];
  const modalFinalPrice = Number((selectedSizeObj.basePrice + extraPrice).toFixed(2));

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + curatedList.length) % curatedList.length);
  }, [curatedList.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % curatedList.length);
  }, [curatedList.length]);

  const handleQuickAdd = (sizeLabel = 'Grande (8 fatias)', unitPrice = grandePrice) => {
    const prodId = Number(currentSabor.id_sabor ?? currentSabor.id ?? currentIndex + 1);
    addToCart({
      id_produto: prodId,
      tipo_item: 'pizza',
      nome: `Pizza ${currentSabor.nome_sabor}`,
      detalhes: `${sizeLabel} · Massa Tradicional`,
      quantidade: 1,
      preco_unitario: unitPrice,
    });
    setJustAddedId(prodId);
    onAddedToCart?.(currentSabor.nome_sabor, sizeLabel);
    setTimeout(() => {
      setJustAddedId((prev) => (prev === prodId ? null : prev));
    }, 1800);
  };

  const categoriaLabel = String(currentSabor.categoria_sabor || 'tradicional').toUpperCase();
  const isFeatured = currentSabor.destaque === 1 || currentSabor.destaque === true;
  const currentProdKey = Number(currentSabor.id_sabor ?? currentSabor.id ?? currentIndex + 1);
  const isJustAdded = justAddedId === currentProdKey;

  return (
    <View style={localStyles.showcaseContainer}>
      <View style={localStyles.topOrb} />

      {/* Cabeçalho Nossas Pizzas */}
      <View style={localStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={[styles.rowGap, { gap: 6, marginBottom: 3 }]}>
            <FontAwesome5 name="fire-alt" size={13} color={PIZZARIA_COLORS.gold} />
            <Text style={localStyles.eyebrowText}>VITRINE OFICIAL · CARROSSEL AO VIVO</Text>
          </View>
          <Text style={localStyles.titleText}>Nossas Pizzas</Text>
          <Text style={localStyles.subtitleText}>
            Escolha entre nossos sabores especiais{loading ? ' · atualizando...' : ''}
          </Text>
        </View>

        <View style={localStyles.counterPill}>
          <Text style={localStyles.counterPillText}>
            {currentIndex + 1} / {curatedList.length}
          </Text>
        </View>
      </View>

      {/* Corpo Responsivo (Lado a Lado no PC/Tablet, Empilhado no Celular) */}
      <View style={[localStyles.showcaseBody, isWideLayout && localStyles.showcaseBodyWide]}>
        {/* Coluna da Foto Circular c/ Glow + Setas ‹ › */}
        <View style={localStyles.visualColumn}>
          <TouchableOpacity
            style={localStyles.arrowBtn}
            onPress={goPrev}
            activeOpacity={0.8}
            accessibilityLabel="Sabor anterior"
          >
            <Text style={localStyles.arrowSymbol}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.pizzaCircleOuter,
              isWideLayout && { width: 214, height: 214, borderRadius: 107 },
            ]}
            onPress={() => setDetailsOpen(true)}
            activeOpacity={0.9}
          >
            <Image
              source={getPizzaImageSource(currentSabor.nome_sabor, currentSabor.imagem_url)}
              style={localStyles.pizzaCircleImg}
              resizeMode="cover"
            />
            <View style={localStyles.zoomHintPill}>
              <Feather name="maximize-2" size={11} color="#FEF08A" />
              <Text style={localStyles.zoomHintText}>Detalhes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.arrowBtn}
            onPress={goNext}
            activeOpacity={0.8}
            accessibilityLabel="Próximo sabor"
          >
            <Text style={localStyles.arrowSymbol}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Coluna de Informações & CTAs */}
        <View style={[localStyles.infoColumn, isWideLayout && { flex: 1, alignItems: 'flex-start' }]}>
          <View style={[styles.rowGap, { flexWrap: 'wrap', gap: 7, marginBottom: 8 }]}>
            <View style={localStyles.categoryBadge}>
              <Text style={localStyles.categoryBadgeText}>{categoriaLabel}</Text>
            </View>
            {isFeatured ? (
              <View style={styles.featuredStarBadge}>
                <FontAwesome5 name="star" solid size={10} color={PIZZARIA_COLORS.gold} />
                <Text style={{ color: PIZZARIA_COLORS.gold, fontSize: 10.5, fontWeight: '800' }}>
                  Mais Pedida
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              localStyles.saborTitle,
              !isWideLayout && { textAlign: 'center' },
            ]}
          >
            {currentSabor.nome_sabor}
          </Text>

          <Text
            style={[
              localStyles.saborDescription,
              !isWideLayout && { textAlign: 'center' },
            ]}
            numberOfLines={3}
          >
            {getPizzaRichDescription(currentSabor.nome_sabor, currentSabor.descricao)}
          </Text>

          {/* Faixa de Preço */}
          <View style={localStyles.priceRow}>
            <View>
              <Text style={localStyles.priceCaption}>Pizza Grande (8 fatias)</Text>
              <Text style={localStyles.priceMain}>{formatCurrency(grandePrice)}</Text>
            </View>
            {extraPrice > 0 ? (
              <View style={localStyles.extraTag}>
                <Text style={localStyles.extraTagText}>
                  Adicional sabor +{formatCurrency(extraPrice)}
                </Text>
              </View>
            ) : (
              <View style={localStyles.extraTagFree}>
                <Text style={localStyles.extraTagFreeText}>Sem taxa extra de sabor</Text>
              </View>
            )}
          </View>

          {/* Botões de Ação */}
          <View style={localStyles.ctaRow}>
            <TouchableOpacity
              style={[
                styles.goldCtaBtn,
                {
                  flex: 1,
                  backgroundColor: isJustAdded ? PIZZARIA_COLORS.emerald : PIZZARIA_COLORS.gold,
                },
              ]}
              onPress={() => handleQuickAdd()}
              activeOpacity={0.85}
            >
              <Feather
                name={isJustAdded ? 'check-circle' : 'shopping-cart'}
                size={15}
                color={isJustAdded ? '#FFFFFF' : '#111827'}
              />
              <Text
                style={[
                  styles.goldCtaText,
                  { color: isJustAdded ? '#FFFFFF' : '#111827' },
                ]}
              >
                {isJustAdded ? 'Adicionado! ✓' : 'Adicionar ao Carrinho'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ghostBtn, localStyles.halfBtn]}
              onPress={() => router.push('/Atividade15_PizzariaTop/montar')}
              activeOpacity={0.85}
            >
              <Feather name="pie-chart" size={14} color={PIZZARIA_COLORS.gold} />
              <Text style={[styles.ghostBtnText, { color: '#FEF08A' }]}>
                Montar Meio a Meio
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Pontos Indicadores Clicáveis */}
      <View style={localStyles.dotsRow}>
        {curatedList.map((item, idx) => {
          const active = idx === currentIndex;
          return (
            <TouchableOpacity
              key={`dot-${item.id_sabor ?? item.id ?? idx}`}
              style={[localStyles.dot, active && localStyles.dotActive]}
              onPress={() => setCurrentIndex(idx)}
              activeOpacity={0.8}
              accessibilityLabel={`Ir para sabor ${idx + 1}`}
            />
          );
        })}
      </View>

      {/* Popup de Detalhes + Seleção de Tamanho (inspirado em PizzaCarousel.jsx + SizeModal) */}
      <Modal
        visible={detailsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetailsOpen(false)}>
          <Pressable
            style={[styles.modalCard, { borderColor: PIZZARIA_COLORS.goldBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{currentSabor.nome_sabor}</Text>
                <Text style={styles.modalSubtitle}>
                  Categoria {categoriaLabel} · Escolha o tamanho ideal
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailsOpen(false)}
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={[localStyles.pizzaCircleOuter, { width: 176, height: 176, borderRadius: 88 }]}>
                <Image
                  source={getPizzaImageSource(currentSabor.nome_sabor, currentSabor.imagem_url)}
                  style={localStyles.pizzaCircleImg}
                  resizeMode="cover"
                />
              </View>
            </View>

            <Text style={[styles.itemDesc, { color: PIZZARIA_COLORS.textSecondary, marginBottom: 14 }]}>
              {getPizzaRichDescription(currentSabor.nome_sabor, currentSabor.descricao)}
            </Text>

            <Text style={styles.inputLabel}>Escolha o Tamanho</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {SIZE_OPTIONS.map((sz) => {
                const selected = sz.key === selectedSizeKey;
                const priceForSize = sz.basePrice + extraPrice;
                return (
                  <TouchableOpacity
                    key={sz.key}
                    style={[
                      localStyles.sizeOptionRow,
                      selected && localStyles.sizeOptionRowActive,
                    ]}
                    onPress={() => setSelectedSizeKey(sz.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.rowGap}>
                      <Feather
                        name={selected ? 'check-circle' : 'circle'}
                        size={16}
                        color={selected ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted}
                      />
                      <Text
                        style={{
                          color: selected ? '#FFFFFF' : PIZZARIA_COLORS.textSecondary,
                          fontWeight: selected ? '800' : '600',
                          fontSize: 13.5,
                        }}
                      >
                        {sz.label}
                      </Text>
                    </View>
                    <Text style={styles.priceText}>{formatCurrency(priceForSize)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDetailsOpen(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goldCtaBtn, { flex: 1.5 }]}
                onPress={() => {
                  handleQuickAdd(selectedSizeObj.label, modalFinalPrice);
                  setDetailsOpen(false);
                }}
                activeOpacity={0.85}
              >
                <Feather name="shopping-cart" size={15} color="#111827" />
                <Text style={styles.goldCtaText}>
                  Pedir Agora · {formatCurrency(modalFinalPrice)}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  showcaseContainer: {
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.28)',
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  topOrb: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  eyebrowText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitleText: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 12.5,
    marginTop: 2,
  },
  counterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  counterPillText: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '800',
  },
  showcaseBody: {
    alignItems: 'center',
    gap: 16,
  },
  showcaseBodyWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  visualColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  arrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowSymbol: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: -2,
  },
  pizzaCircleOuter: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 4,
    borderColor: 'rgba(250, 204, 21, 0.55)',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadow,
  },
  pizzaCircleImg: {
    width: '100%',
    height: '100%',
  },
  zoomHintPill: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
  },
  zoomHintText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
  },
  infoColumn: {
    width: '100%',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 53, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.5)',
  },
  categoryBadgeText: {
    color: '#FDBA74',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saborTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  saborDescription: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  priceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 14,
  },
  priceCaption: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  priceMain: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 20,
    fontWeight: '900',
  },
  extraTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
  },
  extraTagText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  extraTagFree: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.basilBorder,
  },
  extraTagFreeText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '800',
  },
  ctaRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  halfBtn: {
    borderColor: 'rgba(250, 204, 21, 0.45)',
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 16,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  dotActive: {
    width: 28,
    backgroundColor: PIZZARIA_COLORS.gold,
  },
  sizeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PIZZARIA_COLORS.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  sizeOptionRowActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderColor: PIZZARIA_COLORS.gold,
  },
});
