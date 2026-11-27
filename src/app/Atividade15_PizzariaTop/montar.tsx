import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  Borda,
  CalculateResponse,
  Massa,
  Sabor,
  Tamanho,
  calculatePrice,
  extractErrorMessage,
  formatCurrency,
  getBordas,
  getMassas,
  getSabores,
  getTamanhos,
} from '../../services/pizzariatopApi';
import {
  PIZZA_TAMANHOS_IMG,
  getPizzaImageSource,
  getPizzaRichDescription,
  normalizePizzaText,
} from '../../utils/pizzaImageMap';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

type BuilderStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Array<{ step: BuilderStep; label: string }> = [
  { step: 1, label: 'Tamanho' },
  { step: 2, label: 'Sabores' },
  { step: 3, label: 'Massa' },
  { step: 4, label: 'Borda' },
  { step: 5, label: 'Resumo' },
];

function getBordaVisualColor(nomeBorda?: string | null): {
  ringColor: string;
  innerBorder: string;
  badgeText: string;
} {
  const n = normalizePizzaText(nomeBorda);
  if (n.includes('catupiry') || n.includes('requeijao')) {
    return {
      ringColor: '#FDE68A',
      innerBorder: '#F59E0B',
      badgeText: 'Borda Cremosa Catupiry',
    };
  }
  if (n.includes('cheddar')) {
    return {
      ringColor: '#FB923C',
      innerBorder: '#EA580C',
      badgeText: 'Borda Cheddar Especial',
    };
  }
  if (n.includes('chocolate') || n.includes('nutella') || n.includes('doce')) {
    return {
      ringColor: '#78350F',
      innerBorder: '#B45309',
      badgeText: 'Borda Recheada Doce',
    };
  }
  if (n.includes('gergelim') || n.includes('parmesao')) {
    return {
      ringColor: '#FBBF24',
      innerBorder: '#D97706',
      badgeText: nomeBorda || 'Borda Especial',
    };
  }
  return {
    ringColor: '#D97706',
    innerBorder: '#92400E',
    badgeText: nomeBorda || 'Borda Tradicional Dourada',
  };
}

export default function MontarPizzaScreen() {
  const { addToCart } = usePizzariaTop();

  const [step, setStep] = useState<BuilderStep>(1);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [massas, setMassas] = useState<Massa[]>([]);
  const [bordas, setBordas] = useState<Borda[]>([]);

  const [selectedTamanho, setSelectedTamanho] = useState<Tamanho | null>(null);
  const [selectedSabores, setSelectedSabores] = useState<Sabor[]>([]);
  const [selectedMassa, setSelectedMassa] = useState<Massa | null>(null);
  const [selectedBorda, setSelectedBorda] = useState<Borda | null>(null);

  const [saborSearch, setSaborSearch] = useState<string>('');
  const [saborCatFilter, setSaborCatFilter] = useState<string>('todas');

  const [carregando, setCarregando] = useState<boolean>(true);
  const [calculando, setCalculando] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<CalculateResponse | null>(null);
  const [erro, setErro] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const carregarOpcoes = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [tamList, sabList, masList, borList] = await Promise.all([
        getTamanhos(),
        getSabores(true),
        getMassas(),
        getBordas(),
      ]);
      setTamanhos(tamList);
      setSabores(sabList);
      setMassas(masList);
      setBordas(borList);
      if (tamList.length > 0 && !selectedTamanho) {
        setSelectedTamanho(tamList[0]);
      }
      if (masList.length > 0 && !selectedMassa) {
        setSelectedMassa(masList[0]);
      }
      if (borList.length > 0 && !selectedBorda) {
        setSelectedBorda(borList[0]);
      }
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao carregar ingredientes para montar pizza.'));
    } finally {
      setCarregando(false);
    }
  }, [selectedBorda, selectedMassa, selectedTamanho]);

  useEffect(() => {
    carregarOpcoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxSabores = Math.max(1, Number(selectedTamanho?.numero_sabores ?? 2));

  const toggleSabor = (sabor: Sabor) => {
    const id = sabor.id_sabor ?? sabor.id;
    const exists = selectedSabores.some((s) => (s.id_sabor ?? s.id) === id);
    if (exists) {
      setSelectedSabores((prev) => prev.filter((s) => (s.id_sabor ?? s.id) !== id));
      return;
    }
    if (selectedSabores.length >= maxSabores) {
      setSelectedSabores((prev) => [...prev.slice(1), sabor]);
      return;
    }
    setSelectedSabores((prev) => [...prev, sabor]);
  };

  const filteredSaboresStep = useMemo(() => {
    const q = saborSearch.trim().toLowerCase();
    return sabores.filter((s) => {
      if (saborCatFilter !== 'todas') {
        const rawCat = String(s.categoria_sabor ?? 'tradicional').trim().toLowerCase();
        if (rawCat !== saborCatFilter) return false;
      }
      if (!q) return true;
      const nome = String(s.nome_sabor ?? '').toLowerCase();
      const desc = String(s.descricao ?? '').toLowerCase();
      return nome.includes(q) || desc.includes(q);
    });
  }, [sabores, saborSearch, saborCatFilter]);

  const estimatedLocalPrice = useMemo(() => {
    const base = Number(selectedTamanho?.preco_base ?? 35);
    const sabExtra = selectedSabores.reduce(
      (sum, s) => sum + Number(s.preco_adicional ?? 0),
      0
    );
    const massaExtra = Number(selectedMassa?.preco_adicional ?? 0);
    const bordaExtra = Number(selectedBorda?.preco_adicional ?? 0);
    return base + sabExtra + massaExtra + bordaExtra;
  }, [selectedBorda, selectedMassa, selectedSabores, selectedTamanho]);

  const executarCalculoApi = useCallback(async () => {
    if (!selectedTamanho) return;
    setCalculando(true);
    setFeedback('');
    try {
      const resposta = await calculatePrice({
        type: 'pizza',
        tamanho: selectedTamanho.nome_tamanho.toLowerCase(),
        sabores: selectedSabores.map((s) => s.nome_sabor),
        massa: selectedMassa?.nome_massa,
        borda: selectedBorda?.nome_borda,
      });
      setCalcResult(resposta);
    } catch (e) {
      setFeedback(extractErrorMessage(e, 'Usando estimativa local (API /calculate indisponível).'));
      setCalcResult(null);
    } finally {
      setCalculando(false);
    }
  }, [selectedBorda, selectedMassa, selectedSabores, selectedTamanho]);

  useEffect(() => {
    if (step === 5) {
      executarCalculoApi();
    }
  }, [step, executarCalculoApi]);

  const finalUnitPrice = useMemo(() => {
    const apiTotal = Number(calcResult?.total ?? calcResult?.data?.total ?? 0);
    if (apiTotal > 0) return apiTotal;
    return estimatedLocalPrice;
  }, [calcResult, estimatedLocalPrice]);

  const bordaVisual = useMemo(
    () => getBordaVisualColor(selectedBorda?.nome_borda),
    [selectedBorda]
  );

  const handleAddPizzaToCart = () => {
    if (!selectedTamanho || selectedSabores.length === 0) {
      setFeedback('Escolha um tamanho e pelo menos 1 sabor.');
      return;
    }

    const saborNames = selectedSabores.map((s) => s.nome_sabor).join(' / ');
    const detalhes = [
      `Tamanho: ${selectedTamanho.nome_tamanho}`,
      `Sabores: ${saborNames}`,
      selectedMassa ? `Massa: ${selectedMassa.nome_massa}` : null,
      selectedBorda ? `Borda: ${selectedBorda.nome_borda}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    addToCart({
      id_produto: Number(selectedTamanho.id_tamanho ?? selectedTamanho.id ?? 1),
      tipo_item: 'pizza',
      nome: `Pizza ${selectedTamanho.nome_tamanho}`,
      detalhes,
      quantidade: 1,
      preco_unitario: finalUnitPrice,
    });

    setFeedback('Pizza adicionada ao carrinho!');
    router.replace('/Atividade15_PizzariaTop/pedidos');
  };

  const renderVisualPizzaDisc = () => {
    const count = selectedSabores.length;

    if (count === 0) {
      return (
        <View style={localStyles.emptyDoughCenter}>
          <FontAwesome5 name="pizza-slice" size={26} color="#FDE68A" />
          <Text style={localStyles.emptyDoughText}>
            Escolha até {maxSabores} sabor{maxSabores > 1 ? 'es' : ''}
          </Text>
        </View>
      );
    }

    if (count === 1) {
      const s0 = selectedSabores[0];
      return (
        <View style={localStyles.pizzaFillWrap}>
          <Image
            source={getPizzaImageSource(s0.nome_sabor, s0.imagem_url)}
            style={localStyles.pizzaFullImg}
            resizeMode="cover"
          />
          <View style={localStyles.sliceGuideVertical} />
          <View style={localStyles.sliceGuideHorizontal} />
        </View>
      );
    }

    if (count === 2) {
      const [s0, s1] = selectedSabores;
      return (
        <View style={[localStyles.pizzaFillWrap, { flexDirection: 'row' }]}>
          <View style={localStyles.halfSliceWrap}>
            <Image
              source={getPizzaImageSource(s0.nome_sabor, s0.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
          <View style={localStyles.crustDividerVertical} />
          <View style={localStyles.halfSliceWrap}>
            <Image
              source={getPizzaImageSource(s1.nome_sabor, s1.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    if (count === 3) {
      const [s0, s1, s2] = selectedSabores;
      return (
        <View style={localStyles.pizzaFillWrap}>
          <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
            <Image
              source={getPizzaImageSource(s0.nome_sabor, s0.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
          <View style={localStyles.crustDividerHorizontal} />
          <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <Image
                source={getPizzaImageSource(s1.nome_sabor, s1.imagem_url)}
                style={localStyles.pizzaFullImg}
                resizeMode="cover"
              />
            </View>
            <View style={localStyles.crustDividerVertical} />
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <Image
                source={getPizzaImageSource(s2.nome_sabor, s2.imagem_url)}
                style={localStyles.pizzaFullImg}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      );
    }

    // 4 ou mais sabores -> 4 quartos visuais
    const [s0, s1, s2, s3] = selectedSabores;
    return (
      <View style={localStyles.pizzaFillWrap}>
        <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Image
              source={getPizzaImageSource(s0.nome_sabor, s0.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
          <View style={localStyles.crustDividerVertical} />
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Image
              source={getPizzaImageSource(s1.nome_sabor, s1.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
        </View>
        <View style={localStyles.crustDividerHorizontal} />
        <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Image
              source={getPizzaImageSource(s2.nome_sabor, s2.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
          <View style={localStyles.crustDividerVertical} />
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Image
              source={getPizzaImageSource(s3.nome_sabor, s3.imagem_url)}
              style={localStyles.pizzaFullImg}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <PizzariaTopShell activeTab="montar" subtitle="Monte sua Pizza Artesanal (Axios)">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrap}>
          {/* Stepper */}
          <View style={styles.stepperRow}>
            {STEP_LABELS.map((item) => {
              const active = step === item.step;
              const done = step > item.step;
              return (
                <TouchableOpacity
                  key={item.step}
                  style={[
                    styles.stepChip,
                    active && styles.stepChipActive,
                    done && styles.stepChipDone,
                  ]}
                  onPress={() => setStep(item.step)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.stepChipText, (active || done) && styles.stepChipTextActive]}>
                    {item.step}. {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
                Buscando tamanhos, sabores, massas e bordas...
              </Text>
            </View>
          )}

          {erro !== '' && !carregando && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{erro}</Text>
              <TouchableOpacity style={styles.primaryCtaBtn} onPress={carregarOpcoes}>
                <Text style={styles.primaryCtaText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!carregando && erro === '' && (
            <>
              {/* PREVIEW VISUAL AO VIVO DA PIZZA MONTADA */}
              <View style={localStyles.previewCard}>
                <View style={localStyles.previewHeaderRow}>
                  <View style={styles.rowGap}>
                    <View style={localStyles.livePulseDot} />
                    <Text style={localStyles.previewHeaderTitle}>
                      Preview da Sua Pizza Montada
                    </Text>
                  </View>
                  <Text style={styles.priceText}>{formatCurrency(finalUnitPrice)}</Text>
                </View>

                <View style={localStyles.previewBodyRow}>
                  {/* Tábua & Borda Dinâmica */}
                  <View
                    style={[
                      localStyles.pizzaCrustRing,
                      {
                        backgroundColor: bordaVisual.ringColor,
                        borderColor: bordaVisual.innerBorder,
                      },
                    ]}
                  >
                    <View style={localStyles.pizzaInnerCircle}>
                      {renderVisualPizzaDisc()}
                      <View style={localStyles.pizzaCenterOlive} />
                    </View>
                  </View>

                  {/* Especificações da Montagem */}
                  <View style={localStyles.previewDetailsCol}>
                    <View style={localStyles.specRow}>
                      <Text style={localStyles.specLabel}>Tamanho:</Text>
                      <Text style={localStyles.specVal}>
                        {selectedTamanho?.nome_tamanho ?? 'Selecione'} (
                        {selectedTamanho?.numero_fatias ?? 8} fatias)
                      </Text>
                    </View>

                    <View style={localStyles.specRow}>
                      <Text style={localStyles.specLabel}>Divisão:</Text>
                      <Text style={[localStyles.specVal, { color: PIZZARIA_COLORS.gold }]}>
                        {selectedSabores.length === 0
                          ? `0/${maxSabores} sabores`
                          : selectedSabores.length === 1
                          ? 'Pizza Inteira (1/1)'
                          : `${selectedSabores.length} Sabores (1/${selectedSabores.length} cada)`}
                      </Text>
                    </View>

                    <View style={localStyles.specRow}>
                      <Text style={localStyles.specLabel}>Massa:</Text>
                      <Text style={localStyles.specVal}>
                        {selectedMassa?.nome_massa ?? 'Tradicional'}
                      </Text>
                    </View>

                    <View style={localStyles.specRow}>
                      <Text style={localStyles.specLabel}>Borda:</Text>
                      <Text style={localStyles.specVal}>
                        {selectedBorda?.nome_borda ?? 'Tradicional'}
                      </Text>
                    </View>

                    {selectedSabores.length > 0 ? (
                      <View style={localStyles.selectedSaborPillsWrap}>
                        {selectedSabores.map((sab, idx) => (
                          <TouchableOpacity
                            key={`chip-${sab.id_sabor ?? sab.id ?? idx}`}
                            style={localStyles.selectedSaborChip}
                            onPress={() => toggleSabor(sab)}
                            activeOpacity={0.75}
                          >
                            <Image
                              source={getPizzaImageSource(sab.nome_sabor, sab.imagem_url)}
                              style={localStyles.selectedSaborMiniImg}
                            />
                            <Text style={localStyles.selectedSaborChipText} numberOfLines={1}>
                              1/{selectedSabores.length} {sab.nome_sabor}
                            </Text>
                            <Feather name="x" size={11} color="#FDE68A" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={localStyles.chooseFlavorHintBtn}
                        onPress={() => setStep(2)}
                        activeOpacity={0.8}
                      >
                        <Feather name="plus-circle" size={13} color={PIZZARIA_COLORS.gold} />
                        <Text style={localStyles.chooseFlavorHintText}>
                          Escolher sabores agora
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* PASSO 1: TAMANHO (com PIZZA_TAMANHOS_IMG oficial) */}
              {step === 1 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionDot} />
                      <Text style={styles.sectionTitle}>1. Escolha o Tamanho</Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /tamanhos</Text>
                  </View>

                  {/* Guia Visual Oficial PIZZA_TAMANHOS_IMG */}
                  <View style={localStyles.tamanhosBannerCard}>
                    <Image
                      source={PIZZA_TAMANHOS_IMG}
                      style={localStyles.tamanhosBannerImg}
                      resizeMode="contain"
                    />
                    <View style={localStyles.tamanhosBannerFooter}>
                      <Feather name="info" size={13} color={PIZZARIA_COLORS.gold} />
                      <Text style={localStyles.tamanhosBannerCaption}>
                        Comparativo oficial de diâmetro, fatias e divisão de sabores Pizzaria TOP
                      </Text>
                    </View>
                  </View>

                  {tamanhos.map((tam, idx) => {
                    const id = tam.id_tamanho ?? tam.id ?? idx;
                    const selected =
                      (selectedTamanho?.id_tamanho ?? selectedTamanho?.id) ===
                      (tam.id_tamanho ?? tam.id);
                    const circleSize = Math.min(48, Math.max(28, 28 + idx * 5));

                    return (
                      <TouchableOpacity
                        key={`tam-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => {
                          setSelectedTamanho(tam);
                          setSelectedSabores((prev) =>
                            prev.slice(0, Math.max(1, Number(tam.numero_sabores ?? 2)))
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={[styles.rowGap, { flex: 1 }]}>
                            <View style={localStyles.sizeCircleBox}>
                              <View
                                style={[
                                  localStyles.sizeScaleDisc,
                                  {
                                    width: circleSize,
                                    height: circleSize,
                                    borderRadius: circleSize / 2,
                                    borderColor: selected
                                      ? PIZZARIA_COLORS.gold
                                      : PIZZARIA_COLORS.fireOrange,
                                  },
                                ]}
                              >
                                <Text style={localStyles.sizeSlicesBadgeText}>
                                  {tam.numero_fatias}f
                                </Text>
                              </View>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemTitle}>{tam.nome_tamanho}</Text>
                              <Text style={styles.itemDesc}>
                                {tam.numero_fatias} fatias · Até {tam.numero_sabores} sabor(es)
                                {tam.diametro_cm ? ` · ${tam.diametro_cm}cm` : ''}
                              </Text>
                              {tam.descricao ? (
                                <Text style={[styles.itemDesc, { marginTop: 3 }]}>
                                  {tam.descricao}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <Text style={styles.priceText}>{formatCurrency(tam.preco_base)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={[styles.goldCtaBtn, { marginTop: 8 }]}
                    onPress={() => setStep(2)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.goldCtaText}>Avançar para Sabores</Text>
                    <Feather name="arrow-right" size={16} color="#111827" />
                  </TouchableOpacity>
                </View>
              )}

              {/* PASSO 2: SABORES (com fotos reais getPizzaImageSource) */}
              {step === 2 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionDot} />
                      <Text style={styles.sectionTitle}>
                        2. Escolha os Sabores ({selectedSabores.length}/{maxSabores})
                      </Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /sabores</Text>
                  </View>

                  {/* Busca rápida de sabores no montador */}
                  <View style={styles.searchBarWrap}>
                    <Feather name="search" size={15} color={PIZZARIA_COLORS.textMuted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Filtrar sabor (ex: calabresa, 4 queijos, chocolate)..."
                      placeholderTextColor={PIZZARIA_COLORS.textMuted}
                      value={saborSearch}
                      onChangeText={setSaborSearch}
                    />
                    {saborSearch ? (
                      <TouchableOpacity onPress={() => setSaborSearch('')}>
                        <Feather name="x-circle" size={15} color={PIZZARIA_COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipRow}
                  >
                    {[
                      { key: 'todas', label: 'Todos' },
                      { key: 'tradicional', label: 'Tradicionais' },
                      { key: 'especial', label: 'Especiais' },
                      { key: 'premium', label: 'Premium' },
                      { key: 'doce', label: 'Doces' },
                    ].map((c) => {
                      const active = saborCatFilter === c.key;
                      return (
                        <TouchableOpacity
                          key={c.key}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                          onPress={() => setSaborCatFilter(c.key)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              active && styles.filterChipTextActive,
                            ]}
                          >
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {filteredSaboresStep.map((sabor, idx) => {
                    const id = sabor.id_sabor ?? sabor.id ?? idx;
                    const slotIndex = selectedSabores.findIndex(
                      (s) => (s.id_sabor ?? s.id) === (sabor.id_sabor ?? sabor.id)
                    );
                    const selected = slotIndex >= 0;

                    return (
                      <TouchableOpacity
                        key={`sab-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => toggleSabor(sabor)}
                        activeOpacity={0.82}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={[styles.rowGap, { flex: 1 }]}>
                            <View
                              style={[
                                localStyles.saborThumbWrap,
                                selected && { borderColor: PIZZARIA_COLORS.gold },
                              ]}
                            >
                              <Image
                                source={getPizzaImageSource(
                                  sabor.nome_sabor,
                                  sabor.imagem_url
                                )}
                                style={localStyles.saborThumbImg}
                                resizeMode="cover"
                              />
                              {selected ? (
                                <View style={localStyles.slotNumberBadge}>
                                  <Text style={localStyles.slotNumberText}>
                                    {slotIndex + 1}º
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemTitle}>{sabor.nome_sabor}</Text>
                              <Text style={styles.itemDesc} numberOfLines={2}>
                                {getPizzaRichDescription(
                                  sabor.nome_sabor,
                                  sabor.descricao
                                )}
                              </Text>
                            </View>
                          </View>

                          <View style={{ alignItems: 'flex-end', gap: 5 }}>
                            {Number(sabor.preco_adicional ?? 0) > 0 ? (
                              <Text style={styles.priceText}>
                                +{formatCurrency(sabor.preco_adicional)}
                              </Text>
                            ) : (
                              <Text style={styles.sectionMeta}>Incluso</Text>
                            )}
                            <Feather
                              name={selected ? 'check-circle' : 'plus-circle'}
                              size={20}
                              color={
                                selected ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted
                              }
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={[styles.rowGap, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.ghostBtn, { flex: 1 }]}
                      onPress={() => setStep(1)}
                    >
                      <Feather name="arrow-left" size={15} color="#FFFFFF" />
                      <Text style={styles.ghostBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.goldCtaBtn,
                        { flex: 2, opacity: selectedSabores.length === 0 ? 0.55 : 1 },
                      ]}
                      disabled={selectedSabores.length === 0}
                      onPress={() => setStep(3)}
                    >
                      <Text style={styles.goldCtaText}>Escolher Massa</Text>
                      <Feather name="arrow-right" size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PASSO 3: MASSA */}
              {step === 3 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionDot} />
                      <Text style={styles.sectionTitle}>3. Escolha a Massa</Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /massas</Text>
                  </View>

                  {massas.map((massa, idx) => {
                    const id = massa.id_massa ?? massa.id ?? idx;
                    const selected =
                      (selectedMassa?.id_massa ?? selectedMassa?.id) ===
                      (massa.id_massa ?? massa.id);
                    return (
                      <TouchableOpacity
                        key={`mas-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => setSelectedMassa(massa)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{massa.nome_massa}</Text>
                            <Text style={styles.itemDesc}>
                              {massa.descricao || 'Fermentação lenta e textura leve'}
                            </Text>
                          </View>
                          <Text style={styles.priceText}>
                            {Number(massa.preco_adicional ?? 0) > 0
                              ? `+${formatCurrency(massa.preco_adicional)}`
                              : 'Inclusa'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={[styles.rowGap, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.ghostBtn, { flex: 1 }]}
                      onPress={() => setStep(2)}
                    >
                      <Feather name="arrow-left" size={15} color="#FFFFFF" />
                      <Text style={styles.ghostBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.goldCtaBtn, { flex: 2 }]}
                      onPress={() => setStep(4)}
                    >
                      <Text style={styles.goldCtaText}>Escolher Borda</Text>
                      <Feather name="arrow-right" size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PASSO 4: BORDA */}
              {step === 4 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionDot} />
                      <Text style={styles.sectionTitle}>4. Escolha a Borda</Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /bordas</Text>
                  </View>

                  {bordas.map((borda, idx) => {
                    const id = borda.id_borda ?? borda.id ?? idx;
                    const selected =
                      (selectedBorda?.id_borda ?? selectedBorda?.id) ===
                      (borda.id_borda ?? borda.id);
                    const bColor = getBordaVisualColor(borda.nome_borda);
                    return (
                      <TouchableOpacity
                        key={`bor-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => setSelectedBorda(borda)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={[styles.rowGap, { flex: 1 }]}>
                            <View
                              style={[
                                localStyles.bordaSampleSwatch,
                                {
                                  backgroundColor: bColor.ringColor,
                                  borderColor: bColor.innerBorder,
                                },
                              ]}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemTitle}>{borda.nome_borda}</Text>
                              <Text style={styles.itemDesc}>
                                {borda.descricao || 'Assada no forno a lenha'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.priceText}>
                            {Number(borda.preco_adicional ?? 0) > 0
                              ? `+${formatCurrency(borda.preco_adicional)}`
                              : 'Inclusa'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={[styles.rowGap, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.ghostBtn, { flex: 1 }]}
                      onPress={() => setStep(3)}
                    >
                      <Feather name="arrow-left" size={15} color="#FFFFFF" />
                      <Text style={styles.ghostBtnText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.goldCtaBtn, { flex: 2 }]}
                      onPress={() => setStep(5)}
                    >
                      <Text style={styles.goldCtaText}>Calcular Preço</Text>
                      <Feather name="arrow-right" size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PASSO 5: RESUMO & CÁLCULO AXIOS */}
              {step === 5 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View
                        style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.gold }]}
                      />
                      <Text style={styles.sectionTitle}>
                        5. Resumo & Cálculo (POST /calculate)
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.glassCard, styles.glassCardGold]}>
                    <Text style={styles.itemTitle}>
                      Pizza {selectedTamanho?.nome_tamanho ?? 'Personalizada'}
                    </Text>
                    <Text style={[styles.itemDesc, { marginBottom: 6 }]}>
                      Sabores:{' '}
                      {selectedSabores.length > 0
                        ? selectedSabores.map((s) => s.nome_sabor).join(' + ')
                        : 'Nenhum selecionado'}
                    </Text>
                    <Text style={[styles.itemDesc, { marginBottom: 6 }]}>
                      Massa: {selectedMassa?.nome_massa ?? 'Tradicional'}
                    </Text>
                    <Text style={[styles.itemDesc, { marginBottom: 12 }]}>
                      Borda: {selectedBorda?.nome_borda ?? 'Tradicional'}
                    </Text>

                    {calculando ? (
                      <View style={styles.rowGap}>
                        <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                        <Text style={styles.itemDesc}>Calculando via POST /calculate...</Text>
                      </View>
                    ) : (
                      <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                        <Text style={styles.sectionTitle}>Total estimado:</Text>
                        <Text style={[styles.priceText, { fontSize: 20 }]}>
                          {formatCurrency(finalUnitPrice)}
                        </Text>
                      </View>
                    )}

                    {calcResult && (
                      <View style={styles.jsonBox}>
                        <Text style={styles.jsonText}>
                          {JSON.stringify(calcResult, null, 2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.rowGap, { marginTop: 6 }]}>
                    <TouchableOpacity
                      style={[styles.ghostBtn, { flex: 1 }]}
                      onPress={executarCalculoApi}
                    >
                      <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                      <Text style={styles.ghostBtnText}>Recalcular</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryCtaBtn, { flex: 2 }]}
                      onPress={handleAddPizzaToCart}
                      activeOpacity={0.85}
                    >
                      <FontAwesome5 name="cart-plus" size={14} color="#FFFFFF" />
                      <Text style={styles.primaryCtaText}>Adicionar ao Carrinho</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}

const localStyles = StyleSheet.create({
  previewCard: {
    backgroundColor: '#1B1824',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.goldBorder,
    padding: 15,
    marginBottom: 16,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PIZZARIA_COLORS.emerald,
  },
  previewHeaderTitle: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  previewBodyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  pizzaCrustRing: {
    width: 146,
    height: 146,
    borderRadius: 73,
    padding: 9,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pizzaInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3B2314',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pizzaFillWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  halfSliceWrap: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  pizzaFullImg: {
    width: '100%',
    height: '100%',
  },
  crustDividerVertical: {
    width: 3,
    height: '100%',
    backgroundColor: '#FACC15',
  },
  crustDividerHorizontal: {
    width: '100%',
    height: 3,
    backgroundColor: '#FACC15',
  },
  sliceGuideVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  sliceGuideHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  pizzaCenterOlive: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#FACC15',
  },
  emptyDoughCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  emptyDoughText: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewDetailsCol: {
    flex: 1,
    minWidth: 185,
    gap: 5,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  specLabel: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  specVal: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  selectedSaborPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  selectedSaborChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  selectedSaborMiniImg: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  selectedSaborChipText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 135,
  },
  chooseFlavorHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
  },
  chooseFlavorHintText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 11.5,
    fontWeight: '800',
  },
  tamanhosBannerCard: {
    backgroundColor: PIZZARIA_COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
    padding: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  tamanhosBannerImg: {
    width: '100%',
    height: 155,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tamanhosBannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  tamanhosBannerCaption: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  sizeCircleBox: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeScaleDisc: {
    borderWidth: 2,
    backgroundColor: 'rgba(255, 107, 53, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSlicesBadgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '900',
  },
  saborThumbWrap: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: PIZZARIA_COLORS.fireBorder,
    overflow: 'hidden',
    backgroundColor: PIZZARIA_COLORS.bgElevated,
  },
  saborThumbImg: {
    width: '100%',
    height: '100%',
  },
  slotNumberBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PIZZARIA_COLORS.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderTopLeftRadius: 8,
  },
  slotNumberText: {
    color: '#111827',
    fontSize: 9.5,
    fontWeight: '900',
  },
  bordaSampleSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
  },
});
