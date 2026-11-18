import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
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

  return (
    <PizzariaTopShell activeTab="montar" subtitle="Monte sua Pizza (Axios)">
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
              {/* PASSO 1: TAMANHO */}
              {step === 1 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={styles.sectionDot} />
                      <Text style={styles.sectionTitle}>1. Escolha o Tamanho</Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /tamanhos</Text>
                  </View>

                  {tamanhos.map((tam, idx) => {
                    const id = tam.id_tamanho ?? tam.id ?? idx;
                    const selected =
                      (selectedTamanho?.id_tamanho ?? selectedTamanho?.id) ===
                      (tam.id_tamanho ?? tam.id);
                    return (
                      <TouchableOpacity
                        key={`tam-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => {
                          setSelectedTamanho(tam);
                          setSelectedSabores((prev) => prev.slice(0, Math.max(1, Number(tam.numero_sabores ?? 2))));
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{tam.nome_tamanho}</Text>
                            <Text style={styles.itemDesc}>
                              {tam.numero_fatias} fatias · Até {tam.numero_sabores} sabor(es)
                              {tam.diametro_cm ? ` · ${tam.diametro_cm}cm` : ''}
                            </Text>
                            {tam.descricao ? (
                              <Text style={[styles.itemDesc, { marginTop: 3 }]}>{tam.descricao}</Text>
                            ) : null}
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

              {/* PASSO 2: SABORES */}
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

                  {sabores.map((sabor, idx) => {
                    const id = sabor.id_sabor ?? sabor.id ?? idx;
                    const selected = selectedSabores.some(
                      (s) => (s.id_sabor ?? s.id) === (sabor.id_sabor ?? sabor.id)
                    );
                    return (
                      <TouchableOpacity
                        key={`sab-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => toggleSabor(sabor)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{sabor.nome_sabor}</Text>
                            <Text style={styles.itemDesc}>
                              {sabor.descricao || 'Receita especial da casa'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {Number(sabor.preco_adicional ?? 0) > 0 && (
                              <Text style={styles.priceText}>
                                +{formatCurrency(sabor.preco_adicional)}
                              </Text>
                            )}
                            <Feather
                              name={selected ? 'check-circle' : 'circle'}
                              size={18}
                              color={selected ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted}
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
                      <Text style={styles.goldCtaText}>Massa</Text>
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
                      <Text style={styles.goldCtaText}>Borda</Text>
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
                    return (
                      <TouchableOpacity
                        key={`bor-${id}`}
                        style={[styles.glassCard, selected && styles.glassCardSelected]}
                        onPress={() => setSelectedBorda(borda)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{borda.nome_borda}</Text>
                            <Text style={styles.itemDesc}>
                              {borda.descricao || 'Assada no forno a lenha'}
                            </Text>
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
                      <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.gold }]} />
                      <Text style={styles.sectionTitle}>5. Resumo & Cálculo (POST /calculate)</Text>
                    </View>
                  </View>

                  <View style={[styles.glassCard, styles.glassCardGold]}>
                    <Text style={styles.itemTitle}>
                      Pizza {selectedTamanho?.nome_tamanho ?? 'Personalizada'}
                    </Text>
                    <Text style={[styles.itemDesc, { marginBottom: 6 }]}>
                      Sabores:{' '}
                      {selectedSabores.length > 0
                        ? selectedSabores.map((s) => s.nome_sabor).join(', ')
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
