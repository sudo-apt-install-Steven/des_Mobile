import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  Endereco,
  Pedido,
  TrackingResponse,
  buscarCep,
  createEndereco,
  createPedido,
  extractErrorMessage,
  formatCurrency,
  getEnderecos,
  getPedidos,
  getTempoEntrega,
  getTracking,
  validateCupom,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const STATUS_BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  pendente: { bg: 'rgba(245, 158, 11, 0.2)', fg: '#FCD34D' },
  confirmado: { bg: 'rgba(59, 130, 246, 0.2)', fg: '#93C5FD' },
  preparando: { bg: 'rgba(139, 92, 246, 0.2)', fg: '#C4B5FD' },
  saiu_entrega: { bg: 'rgba(6, 182, 212, 0.2)', fg: '#67E8F9' },
  entregue: { bg: 'rgba(16, 185, 129, 0.2)', fg: '#6EE7B7' },
  cancelado: { bg: 'rgba(239, 68, 68, 0.2)', fg: '#FCA5A5' },
};

const SPLIT_PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

interface OrderStepDef {
  key: string;
  label: string;
  sublabel: string;
  icon: keyof typeof Feather.glyphMap;
}

const TIMELINE_5_STEPS: OrderStepDef[] = [
  {
    key: 'pendente',
    label: 'Pedido recebido',
    sublabel: 'Registrado na central Pizzaria TOP',
    icon: 'file-text',
  },
  {
    key: 'confirmado',
    label: 'Confirmado',
    sublabel: 'Pagamento e itens validados',
    icon: 'check-circle',
  },
  {
    key: 'preparando',
    label: 'Preparando',
    sublabel: 'Assando no forno a lenha artesanal',
    icon: 'zap',
  },
  {
    key: 'saiu_entrega',
    label: 'Saiu para entrega',
    sublabel: 'Motoboy em rota até seu endereço',
    icon: 'navigation',
  },
  {
    key: 'entregue',
    label: 'Entregue',
    sublabel: 'Bom apetite! Pedido concluído',
    icon: 'home',
  },
];

function resolveTimelineStepIndex(rawStatus?: string | null): {
  stepIndex: number;
  isCanceled: boolean;
} {
  const s = String(rawStatus ?? 'pendente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (s.includes('cancel')) {
    return { stepIndex: -1, isCanceled: true };
  }
  if (s.includes('entregue') || s.includes('concluido') || s.includes('finalizado')) {
    return { stepIndex: 4, isCanceled: false };
  }
  if (s.includes('saiu') || s.includes('rota') || s.includes('caminho') || s.includes('entrega')) {
    return { stepIndex: 3, isCanceled: false };
  }
  if (s.includes('prepar') || s.includes('forno') || s.includes('cozinha') || s.includes('producao')) {
    return { stepIndex: 2, isCanceled: false };
  }
  if (s.includes('confirm') || s.includes('aprov') || s.includes('aceito')) {
    return { stepIndex: 1, isCanceled: false };
  }
  return { stepIndex: 0, isCanceled: false };
}

function formatTrackingAddress(
  trackingData: TrackingResponse | null,
  pedido?: Pedido | null
): string {
  if (trackingData?.endereco) {
    if (typeof trackingData.endereco === 'string') return trackingData.endereco;
    const end = trackingData.endereco;
    const rua = end.logradouro ?? end.rua ?? '';
    if (rua) return `${rua}, ${end.numero || 'S/N'} · ${end.bairro || 'Centro'}`;
  }
  if (pedido) {
    const rua = pedido.logradouro ?? pedido.rua ?? '';
    if (rua) {
      return `${rua}${pedido.numero ? `, ${pedido.numero}` : ''}${
        pedido.bairro ? ` · ${pedido.bairro}` : ''
      }`;
    }
  }
  return 'Vilhena - RO (Entrega Expressa)';
}

export default function PedidosScreen() {
  const {
    user,
    isVip,
    cart,
    cartSubtotal,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = usePizzariaTop();

  // Calculadora Dividir Conta com Amigos (2 a 8 pessoas)
  const [splitPeople, setSplitPeople] = useState<number>(2);

  // Cupom
  const [cupomInput, setCupomInput] = useState('');
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomMsg, setCupomMsg] = useState('');
  const [descontoValor, setDescontoValor] = useState(0);

  // CEP & Endereço
  const [cepInput, setCepInput] = useState('76900000');
  const [cepLoading, setCepLoading] = useState(false);
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Vilhena');
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<number>(1);

  // Entrega & Checkout
  const [tempoEntrega, setTempoEntrega] = useState<number | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao_credito' | 'dinheiro'>('pix');
  const [observacoes, setObservacoes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Pedidos & Tracking
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [trackingPedidoId, setTrackingPedidoId] = useState<number | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [showRawTrackingJson, setShowRawTrackingJson] = useState(false);

  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');

  const taxaEntrega = isVip ? 0 : 5;
  const totalFinal = useMemo(
    () => Math.max(0, cartSubtotal + (cart.length > 0 ? taxaEntrega : 0) - descontoValor),
    [cart.length, cartSubtotal, descontoValor, taxaEntrega]
  );

  const activeTrackedPedido = useMemo(() => {
    if (trackingPedidoId === null) return null;
    return (
      pedidos.find((p) => Number(p.id_pedido ?? p.id) === trackingPedidoId) ?? null
    );
  }, [pedidos, trackingPedidoId]);

  // Valor base da calculadora de divisão (usa total do carrinho ou do pedido rastreado/recente)
  const splitBaseAmount = useMemo(() => {
    if (cart.length > 0) return totalFinal;
    if (activeTrackedPedido) return Number(activeTrackedPedido.valor_total ?? 89.9);
    if (pedidos.length > 0) return Number(pedidos[0].valor_total ?? 89.9);
    return 89.9;
  }, [activeTrackedPedido, cart.length, pedidos, totalFinal]);

  const valorPorPessoa = useMemo(
    () => splitBaseAmount / Math.max(2, splitPeople),
    [splitBaseAmount, splitPeople]
  );

  const handleRastrear = useCallback(async (idPedido: number) => {
    setTrackingPedidoId(idPedido);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const data = await getTracking(idPedido);
      setTrackingData(data);
    } catch {
      // Se /tracking/:id não tiver telemetria ativa, mantém timeline com status real do pedido
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  const carregarDadosPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    setErro('');
    try {
      const uid = user?.id_usuario ?? user?.id;
      const [tempoRes, pedidosRes] = await Promise.allSettled([
        getTempoEntrega(),
        getPedidos(uid),
      ]);

      if (tempoRes.status === 'fulfilled') {
        const t =
          tempoRes.value?.tempo_estimado ??
          tempoRes.value?.tempo ??
          (tempoRes.value as { tempo_entrega?: number })?.tempo_entrega;
        if (typeof t === 'number') setTempoEntrega(t);
      }

      if (pedidosRes.status === 'fulfilled') {
        const list = pedidosRes.value;
        setPedidos(list);
        if (list.length > 0 && trackingPedidoId === null) {
          const firstOrderId = Number(list[0].id_pedido ?? list[0].id ?? 0);
          if (firstOrderId > 0) {
            handleRastrear(firstOrderId);
          }
        }
      } else {
        setErro(extractErrorMessage(pedidosRes.reason, 'Falha ao buscar pedidos.'));
      }

      if (user) {
        try {
          const endList = await getEnderecos();
          setEnderecos(endList);
          if (endList.length > 0) {
            const firstId = Number(endList[0].id_endereco ?? endList[0].id ?? 1);
            setSelectedEnderecoId(firstId);
          }
        } catch {
          // Opcional se não houver sessão ativa
        }
      }
    } finally {
      setLoadingPedidos(false);
    }
  }, [handleRastrear, trackingPedidoId, user]);

  useEffect(() => {
    carregarDadosPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleValidarCupom = async () => {
    const code = cupomInput.trim();
    if (!code) return;
    setCupomLoading(true);
    setCupomMsg('');
    try {
      const res = await validateCupom(code, user?.id_usuario ?? user?.id);
      const cupom = res?.cupom ?? res?.data ?? res;
      const tipo = cupom?.tipo_desconto;
      const valor = Number(cupom?.valor_desconto ?? 0);
      if (res?.valid === false || res?.success === false) {
        setDescontoValor(0);
        setCupomMsg(res?.message || 'Cupom inválido ou expirado.');
      } else if (tipo === 'percentual') {
        const calc = (cartSubtotal * valor) / 100;
        setDescontoValor(calc);
        setCupomMsg(`Cupom ${code} aplicado: ${valor}% OFF (-${formatCurrency(calc)})`);
      } else if (valor > 0) {
        setDescontoValor(valor);
        setCupomMsg(`Cupom ${code} aplicado: -${formatCurrency(valor)}`);
      } else {
        setCupomMsg(res?.message || 'Cupom validado!');
      }
    } catch (e) {
      setDescontoValor(0);
      setCupomMsg(extractErrorMessage(e, 'Não foi possível validar o cupom.'));
    } finally {
      setCupomLoading(false);
    }
  };

  const handleBuscarCep = async () => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length < 8) {
      setFeedback('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setCepLoading(true);
    setFeedback('');
    try {
      const res = await buscarCep(clean);
      if (res.erro) {
        setFeedback('CEP não encontrado.');
      } else {
        setLogradouro(res.logradouro || '');
        setBairro(res.bairro || '');
        setCidade(res.localidade || res.cidade || 'Vilhena');
        setFeedback(`CEP ${clean} localizado!`);
      }
    } catch (e) {
      setFeedback(extractErrorMessage(e, 'Erro ao consultar CEP.'));
    } finally {
      setCepLoading(false);
    }
  };

  const handleFinalizarPedido = async () => {
    if (cart.length === 0) {
      setFeedback('Seu carrinho está vazio. Monte uma pizza primeiro.');
      return;
    }

    setSubmittingOrder(true);
    setFeedback('');
    setErro('');
    try {
      let enderecoIdToUse = selectedEnderecoId || 1;
      if (user && logradouro.trim() && numero.trim()) {
        try {
          const endCreated = await createEndereco({
            logradouro: logradouro.trim(),
            numero: numero.trim(),
            bairro: bairro.trim() || 'Centro',
            cidade: cidade.trim() || 'Vilhena',
            estado: 'RO',
            cep: cepInput.replace(/\D/g, ''),
          });
          const createdId = Number(
            endCreated?.id_endereco ?? endCreated?.data?.id_endereco ?? endCreated?.id
          );
          if (createdId > 0) enderecoIdToUse = createdId;
        } catch {
          // Segue com o endereço selecionado
        }
      }

      const idUsuario = Number(user?.id_usuario ?? user?.id ?? 1);
      const res = await createPedido({
        id_usuario: idUsuario,
        id_endereco: enderecoIdToUse,
        total: totalFinal,
        valor_total: totalFinal,
        valor_subtotal: cartSubtotal,
        forma_pagamento: formaPagamento,
        observacoes: observacoes.trim() || undefined,
        itens: cart.map((item) => ({
          tipo_item: item.tipo_item,
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        })),
      });

      const createdPedidoId = Number(res?.id_pedido ?? res?.data?.id_pedido ?? res?.id ?? 0);
      clearCart();
      setDescontoValor(0);
      setCupomInput('');
      setObservacoes('');
      setFeedback(
        createdPedidoId > 0
          ? `Pedido #${createdPedidoId} enviado com sucesso! Acompanhe na timeline abaixo.`
          : 'Pedido enviado com sucesso!'
      );
      await carregarDadosPedidos();
      if (createdPedidoId > 0) {
        handleRastrear(createdPedidoId);
      }
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao finalizar pedido na API.'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Cálculo do status atual para a Timeline de 5 passos e Mapa Simulado
  const effectiveTrackingStatus =
    trackingData?.status_pedido ?? activeTrackedPedido?.status_pedido ?? 'saiu_entrega';
  const timelineState = resolveTimelineStepIndex(effectiveTrackingStatus);

  const courierPosition = useMemo(() => {
    if (timelineState.isCanceled) {
      return { leftPct: '16%' as const, topPct: '24%' as const, label: 'Pedido Cancelado' };
    }
    switch (timelineState.stepIndex) {
      case 0:
      case 1:
        return {
          leftPct: '16%' as const,
          topPct: '24%' as const,
          label: '🛵 Aguardando na Pizzaria',
        };
      case 2:
        return {
          leftPct: '26%' as const,
          topPct: '32%' as const,
          label: '🔥 No forno · Motoboy pronto',
        };
      case 3:
        return {
          leftPct: '46%' as const,
          topPct: '46%' as const,
          label: '🛵 Entregador em rota',
        };
      case 4:
      default:
        return {
          leftPct: '68%' as const,
          topPct: '64%' as const,
          label: '🛵 Entregue no destino!',
        };
    }
  }, [timelineState.isCanceled, timelineState.stepIndex]);

  const latDisplay =
    typeof trackingData?.latitude === 'number'
      ? trackingData.latitude.toFixed(4)
      : '-12.7405';
  const lngDisplay =
    typeof trackingData?.longitude === 'number'
      ? trackingData.longitude.toFixed(4)
      : '-60.1458';

  return (
    <PizzariaTopShell activeTab="pedidos" subtitle="Carrinho, Divisão & Status ao Vivo">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrap}>
          {/* Tempo de entrega */}
          <View style={[styles.glassCard, styles.glassCardGold]}>
            <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
              <View style={styles.rowGap}>
                <Feather name="clock" size={18} color={PIZZARIA_COLORS.gold} />
                <View>
                  <Text style={styles.itemTitle}>Tempo Estimado de Entrega</Text>
                  <Text style={styles.itemDesc}>
                    Calculado via GET /tempo_entrega{isVip ? ' · Prioridade VIP ⭐' : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.priceText}>
                {tempoEntrega !== null ? `${tempoEntrega} min` : '35-45 min'}
              </Text>
            </View>
          </View>

          {feedback !== '' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{feedback}</Text>
            </View>
          )}

          {erro !== '' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{erro}</Text>
            </View>
          )}

          {/* Carrinho */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Seu Carrinho</Text>
            </View>
            <Text style={styles.sectionMeta}>{cart.length} item(ns)</Text>
          </View>

          {cart.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={[styles.itemDesc, { marginBottom: 12 }]}>
                Nenhum item no carrinho no momento. Monte sua pizza personalizada ou peça direto na vitrine de sabores!
              </Text>
              <View style={[styles.rowGap, { flexWrap: 'wrap' }]}>
                <TouchableOpacity
                  style={[styles.goldCtaBtn, { flex: 1 }]}
                  onPress={() => router.push('/Atividade15_PizzariaTop/montar')}
                >
                  <FontAwesome5 name="pizza-slice" size={13} color="#111827" />
                  <Text style={styles.goldCtaText}>Ir para Montar Pizza</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1 }]}
                  onPress={() => router.push('/Atividade15_PizzariaTop/sabores')}
                >
                  <Feather name="book-open" size={14} color={PIZZARIA_COLORS.gold} />
                  <Text style={styles.ghostBtnText}>Ver Sabores</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {cart.map((item) => (
                <View key={item.uid} style={styles.glassCard}>
                  <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.nome}</Text>
                      <Text style={styles.itemDesc}>{item.detalhes}</Text>
                      <Text style={[styles.priceText, { marginTop: 6 }]}>
                        {formatCurrency(item.preco_unitario * item.quantidade)}
                      </Text>
                    </View>
                    <View style={styles.rowGap}>
                      <TouchableOpacity
                        style={styles.ghostBtn}
                        onPress={() => updateCartQty(item.uid, -1)}
                      >
                        <Feather name="minus" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.itemTitle}>{item.quantidade}</Text>
                      <TouchableOpacity
                        style={styles.ghostBtn}
                        onPress={() => updateCartQty(item.uid, 1)}
                      >
                        <Feather name="plus" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.ghostBtn, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                        onPress={() => removeFromCart(item.uid)}
                      >
                        <Feather name="trash-2" size={14} color="#FCA5A5" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {/* Cupom */}
              <View style={styles.glassCard}>
                <Text style={styles.inputLabel}>Cupom de Desconto (POST /cupons/validate)</Text>
                <View style={styles.rowGap}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Ex: PIZZA10"
                    placeholderTextColor={PIZZARIA_COLORS.textMuted}
                    value={cupomInput}
                    onChangeText={setCupomInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.goldCtaBtn}
                    onPress={handleValidarCupom}
                    disabled={cupomLoading}
                  >
                    {cupomLoading ? (
                      <ActivityIndicator size="small" color="#111827" />
                    ) : (
                      <Text style={styles.goldCtaText}>Aplicar</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {cupomMsg !== '' && (
                  <Text style={[styles.couponMetaText, { marginTop: 8 }]}>{cupomMsg}</Text>
                )}
              </View>
            </>
          )}

          {/* CALCULADORA: DIVIDIR CONTA COM AMIGOS (2 a 8 Pessoas — fiel ao /teladepagamento) */}
          <View style={localStyles.splitterCard}>
            <View style={localStyles.splitterHeader}>
              <View style={styles.rowGap}>
                <View style={localStyles.splitterIconBadge}>
                  <Feather name="users" size={16} color="#111827" />
                </View>
                <View>
                  <Text style={localStyles.splitterTitle}>
                    Dividir Conta com Amigos
                  </Text>
                  <Text style={localStyles.splitterSub}>
                    {cart.length > 0
                      ? `Calculado sobre o total do carrinho (${formatCurrency(splitBaseAmount)})`
                      : `Simulador de divisão (${formatCurrency(splitBaseAmount)})`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={localStyles.peopleSelectorRow}>
              {SPLIT_PEOPLE_OPTIONS.map((num) => {
                const active = splitPeople === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      localStyles.peopleChip,
                      active && localStyles.peopleChipActive,
                    ]}
                    onPress={() => setSplitPeople(num)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        localStyles.peopleChipText,
                        active && localStyles.peopleChipTextActive,
                      ]}
                    >
                      {num}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={localStyles.splitterResultBox}>
              <View>
                <Text style={localStyles.splitterResultLabel}>
                  Dividindo entre {splitPeople} amigos
                </Text>
                <Text style={localStyles.splitterPixHint}>
                  Ideal para rachar no PIX na hora da pizza 🍕
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={localStyles.splitterPerPersonValue}>
                  {formatCurrency(valorPorPessoa)}
                </Text>
                <Text style={localStyles.splitterPerPersonUnit}>por pessoa</Text>
              </View>
            </View>
          </View>

          {/* Checkout Endereço & Pagamento (quando há itens no carrinho) */}
          {cart.length > 0 && (
            <View style={styles.glassCard}>
              <Text style={styles.inputLabel}>Entrega & CEP (GET /cep?cep=)</Text>
              {enderecos.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.itemDesc, { marginBottom: 6 }]}>
                    Endereços salvos na conta:
                  </Text>
                  {enderecos.map((end, idx) => {
                    const eid = Number(end.id_endereco ?? end.id ?? idx + 1);
                    const selected = selectedEnderecoId === eid;
                    return (
                      <TouchableOpacity
                        key={`end-${eid}`}
                        style={[
                          styles.ghostBtn,
                          {
                            justifyContent: 'flex-start',
                            marginBottom: 6,
                            borderColor: selected
                              ? PIZZARIA_COLORS.fireOrange
                              : PIZZARIA_COLORS.glassBorder,
                          },
                        ]}
                        onPress={() => setSelectedEnderecoId(eid)}
                      >
                        <Feather
                          name={selected ? 'check-circle' : 'map-pin'}
                          size={14}
                          color={selected ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted}
                        />
                        <Text style={styles.ghostBtnText}>
                          {end.logradouro ?? end.rua}, {end.numero} - {end.bairro} ({end.cidade})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={[styles.rowGap, { marginBottom: 10 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="CEP (ex: 76900000)"
                  placeholderTextColor={PIZZARIA_COLORS.textMuted}
                  keyboardType="numeric"
                  value={cepInput}
                  onChangeText={setCepInput}
                />
                <TouchableOpacity
                  style={styles.ghostBtn}
                  onPress={handleBuscarCep}
                  disabled={cepLoading}
                >
                  {cepLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="search" size={14} color="#FFFFFF" />
                      <Text style={styles.ghostBtnText}>Buscar CEP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Rua / Logradouro"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={logradouro}
                onChangeText={setLogradouro}
              />
              <View style={styles.rowGap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Número"
                  placeholderTextColor={PIZZARIA_COLORS.textMuted}
                  value={numero}
                  onChangeText={setNumero}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Bairro"
                  placeholderTextColor={PIZZARIA_COLORS.textMuted}
                  value={bairro}
                  onChangeText={setBairro}
                />
              </View>

              <Text style={styles.inputLabel}>Forma de Pagamento</Text>
              <View style={[styles.rowGap, { marginBottom: 12 }]}>
                {(
                  [
                    { key: 'pix', label: 'PIX' },
                    { key: 'cartao_credito', label: 'Cartão' },
                    { key: 'dinheiro', label: 'Dinheiro' },
                  ] as const
                ).map((pg) => {
                  const active = formaPagamento === pg.key;
                  return (
                    <TouchableOpacity
                      key={pg.key}
                      style={[
                        styles.stepChip,
                        active && styles.stepChipActive,
                      ]}
                      onPress={() => setFormaPagamento(pg.key)}
                    >
                      <Text style={[styles.stepChipText, active && styles.stepChipTextActive]}>
                        {pg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Observações (opcional)"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={observacoes}
                onChangeText={setObservacoes}
              />

              <View style={{ gap: 4, marginBottom: 14 }}>
                <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                  <Text style={styles.itemDesc}>Subtotal</Text>
                  <Text style={styles.itemDesc}>{formatCurrency(cartSubtotal)}</Text>
                </View>
                <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                  <Text style={styles.itemDesc}>Taxa de entrega</Text>
                  <Text style={styles.itemDesc}>
                    {isVip ? 'Grátis (VIP ⭐)' : formatCurrency(taxaEntrega)}
                  </Text>
                </View>
                {descontoValor > 0 && (
                  <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                    <Text style={styles.successText}>Desconto cupom</Text>
                    <Text style={styles.successText}>-{formatCurrency(descontoValor)}</Text>
                  </View>
                )}
                <View style={[styles.rowGap, { justifyContent: 'space-between', marginTop: 4 }]}>
                  <Text style={styles.sectionTitle}>Total</Text>
                  <Text style={[styles.priceText, { fontSize: 19 }]}>
                    {formatCurrency(totalFinal)}
                  </Text>
                </View>
                <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                  <Text style={[styles.itemDesc, { color: PIZZARIA_COLORS.gold }]}>
                    Dividido por {splitPeople} pessoas
                  </Text>
                  <Text style={[styles.itemDesc, { color: PIZZARIA_COLORS.gold, fontWeight: '800' }]}>
                    {formatCurrency(totalFinal / splitPeople)} / cada
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={handleFinalizarPedido}
                disabled={submittingOrder}
                activeOpacity={0.85}
              >
                {submittingOrder ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryCtaText}>Finalizar Pedido (POST /pedidos)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STATUS DO PEDIDO: TIMELINE 5 PASSOS + MAPA SIMULADO DE ENTREGA (/status_pedido) */}
          {trackingPedidoId !== null && (
            <View style={localStyles.trackingShowcaseCard}>
              <View style={localStyles.trackingTopHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowGap}>
                    <View style={localStyles.liveTrackingPill}>
                      <View style={localStyles.liveTrackingDot} />
                      <Text style={localStyles.liveTrackingPillText}>STATUS AO VIVO</Text>
                    </View>
                    <Text style={styles.sectionMeta}>GET /tracking/{trackingPedidoId}</Text>
                  </View>
                  <Text style={[styles.itemTitle, { fontSize: 17, marginTop: 6 }]}>
                    Acompanhamento · Pedido #{trackingPedidoId}
                  </Text>
                </View>

                <View style={styles.rowGap}>
                  <TouchableOpacity
                    style={localStyles.refreshTrackBtn}
                    onPress={() => handleRastrear(trackingPedidoId)}
                    disabled={trackingLoading}
                  >
                    {trackingLoading ? (
                      <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                    ) : (
                      <Feather name="refresh-cw" size={14} color={PIZZARIA_COLORS.gold} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={localStyles.refreshTrackBtn}
                    onPress={() => setTrackingPedidoId(null)}
                  >
                    <Feather name="x" size={15} color={PIZZARIA_COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {timelineState.isCanceled ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>
                    Este pedido encontra-se com status Cancelado.
                  </Text>
                </View>
              ) : (
                /* TIMELINE DE 5 PASSOS FIEL AO /status_pedido */
                <View style={localStyles.timelineWrap}>
                  {TIMELINE_5_STEPS.map((stepItem, idx) => {
                    const completed = idx <= timelineState.stepIndex;
                    const isCurrent = idx === timelineState.stepIndex;
                    const isLast = idx === TIMELINE_5_STEPS.length - 1;

                    return (
                      <View key={stepItem.key} style={localStyles.timelineRow}>
                        <View style={localStyles.timelineLeftTrack}>
                          <View
                            style={[
                              localStyles.timelineCircle,
                              completed && localStyles.timelineCircleDone,
                              isCurrent && localStyles.timelineCircleCurrent,
                            ]}
                          >
                            <Feather
                              name={completed ? stepItem.icon : 'circle'}
                              size={13}
                              color={completed ? '#111827' : PIZZARIA_COLORS.textMuted}
                            />
                          </View>
                          {!isLast && (
                            <View
                              style={[
                                localStyles.timelineConnector,
                                idx < timelineState.stepIndex &&
                                  localStyles.timelineConnectorDone,
                              ]}
                            />
                          )}
                        </View>

                        <View style={localStyles.timelineTextCol}>
                          <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                            <Text
                              style={[
                                localStyles.timelineStepTitle,
                                completed && localStyles.timelineStepTitleDone,
                              ]}
                            >
                              {stepItem.label}
                            </Text>
                            {isCurrent ? (
                              <View style={localStyles.currentStageBadge}>
                                <Text style={localStyles.currentStageBadgeText}>
                                  Etapa Atual
                                </Text>
                              </View>
                            ) : completed ? (
                              <Feather name="check" size={14} color={PIZZARIA_COLORS.gold} />
                            ) : null}
                          </View>
                          <Text style={localStyles.timelineStepSub}>
                            {stepItem.sublabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* MAPA SIMULADO DE ENTREGA ESTILIZADO (🏠 Você e 🛵 Entregador em rota) */}
              <View style={localStyles.simulatedMapOuter}>
                <View style={localStyles.simulatedMapCanvas}>
                  {/* Quarteirões e avenidas estilizados */}
                  <View style={localStyles.mapRoadHorizontalTop} />
                  <View style={localStyles.mapRoadHorizontalBottom} />
                  <View style={localStyles.mapRoadVerticalLeft} />
                  <View style={localStyles.mapRoadVerticalRight} />
                  <View style={localStyles.mapRouteDashedLine} />

                  {/* Origem: Pizzaria TOP */}
                  <View style={[localStyles.mapPinWrap, { left: '8%', top: '14%' }]}>
                    <View style={localStyles.originPinBubble}>
                      <Text style={localStyles.mapPinEmoji}>🍕</Text>
                      <Text style={localStyles.originPinText}>Pizzaria TOP</Text>
                    </View>
                  </View>

                  {/* Marcador dinâmico do Motoboy: 🛵 Entregador em rota */}
                  <View
                    style={[
                      localStyles.mapPinWrap,
                      { left: courierPosition.leftPct, top: courierPosition.topPct },
                    ]}
                  >
                    <View style={localStyles.courierPinBubble}>
                      <Text style={localStyles.courierPinText}>
                        {courierPosition.label}
                      </Text>
                    </View>
                  </View>

                  {/* Destino: 🏠 Você */}
                  <View style={[localStyles.mapPinWrap, { right: '8%', bottom: '14%' }]}>
                    <View style={localStyles.homePinBubble}>
                      <Text style={localStyles.mapPinEmoji}>🏠</Text>
                      <Text style={localStyles.homePinText}>Você</Text>
                    </View>
                  </View>
                </View>

                {/* Barra de Telemetria / Coordenadas do getTracking */}
                <View style={localStyles.mapTelemetryFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={localStyles.telemetryAddress} numberOfLines={1}>
                      📍 {formatTrackingAddress(trackingData, activeTrackedPedido)}
                    </Text>
                    <Text style={localStyles.telemetryCoords}>
                      GPS: {latDisplay}, {lngDisplay} · Previsão:{' '}
                      {String(
                        trackingData?.previsao_entrega ??
                          (tempoEntrega ? `${tempoEntrega} min` : '35 min')
                      )}
                    </Text>
                  </View>

                  {trackingData ? (
                    <TouchableOpacity
                      style={localStyles.jsonToggleBtn}
                      onPress={() => setShowRawTrackingJson((prev) => !prev)}
                    >
                      <Feather name="code" size={12} color={PIZZARIA_COLORS.gold} />
                      <Text style={localStyles.jsonToggleText}>
                        {showRawTrackingJson ? 'Ocultar JSON' : 'JSON'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {showRawTrackingJson && trackingData ? (
                  <View style={[styles.jsonBox, { marginHorizontal: 10, marginBottom: 10 }]}>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(trackingData, null, 2)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Lista de Pedidos */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.cyan }]} />
              <Text style={styles.sectionTitle}>Pedidos Recentes (GET /pedidos)</Text>
            </View>
            <TouchableOpacity onPress={carregarDadosPedidos}>
              <Feather name="refresh-cw" size={16} color={PIZZARIA_COLORS.gold} />
            </TouchableOpacity>
          </View>

          {loadingPedidos ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PIZZARIA_COLORS.fireOrange} />
            </View>
          ) : pedidos.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>Nenhum pedido encontrado.</Text>
            </View>
          ) : (
            pedidos.slice(0, 15).map((ped, idx) => {
              const pid = Number(ped.id_pedido ?? ped.id ?? idx + 1);
              const statusKey = String(ped.status_pedido || 'pendente').toLowerCase();
              const isSelectedForTracking = trackingPedidoId === pid;
              const badge = STATUS_BADGE_COLORS[statusKey] ?? {
                bg: 'rgba(250, 204, 21, 0.16)',
                fg: PIZZARIA_COLORS.gold,
              };
              return (
                <View
                  key={`ped-${pid}`}
                  style={[
                    styles.glassCard,
                    isSelectedForTracking && { borderColor: PIZZARIA_COLORS.gold },
                  ]}
                >
                  <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 6 }]}>
                    <Text style={styles.itemTitle}>Pedido #{pid}</Text>
                    <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusPillText, { color: badge.fg }]}>
                        {ped.status_pedido}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDesc}>
                    {ped.nome_cliente ? `Cliente: ${ped.nome_cliente} · ` : ''}
                    Pagamento: {ped.forma_pagamento || 'N/D'}
                  </Text>
                  <View style={[styles.rowGap, { justifyContent: 'space-between', marginTop: 10 }]}>
                    <Text style={styles.priceText}>{formatCurrency(ped.valor_total)}</Text>
                    <TouchableOpacity
                      style={
                        isSelectedForTracking ? styles.goldCtaBtn : styles.ghostBtn
                      }
                      onPress={() => handleRastrear(pid)}
                    >
                      <Feather
                        name="map-pin"
                        size={13}
                        color={isSelectedForTracking ? '#111827' : PIZZARIA_COLORS.gold}
                      />
                      <Text
                        style={
                          isSelectedForTracking
                            ? styles.goldCtaText
                            : styles.ghostBtnText
                        }
                      >
                        {isSelectedForTracking ? 'Rastreando' : 'Rastrear Status'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}

const localStyles = StyleSheet.create({
  splitterCard: {
    backgroundColor: '#1F1C2C',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.goldBorder,
    padding: 15,
    marginBottom: 14,
  },
  splitterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  splitterIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: PIZZARIA_COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitterTitle: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  splitterSub: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 1,
  },
  peopleSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  peopleChip: {
    flex: 1,
    minWidth: 38,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleChipActive: {
    backgroundColor: PIZZARIA_COLORS.gold,
    borderColor: '#FEF08A',
  },
  peopleChipText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  peopleChipTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  splitterResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.32)',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  splitterResultLabel: {
    color: '#FEF08A',
    fontSize: 13,
    fontWeight: '800',
  },
  splitterPixHint: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  splitterPerPersonValue: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 19,
    fontWeight: '900',
  },
  splitterPerPersonUnit: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '700',
  },
  trackingShowcaseCard: {
    backgroundColor: '#211A17',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PIZZARIA_COLORS.goldBorder,
    padding: 16,
    marginBottom: 16,
  },
  trackingTopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  liveTrackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.gold,
  },
  liveTrackingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PIZZARIA_COLORS.gold,
  },
  liveTrackingPillText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  refreshTrackBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineWrap: {
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelineLeftTrack: {
    width: 30,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCircleDone: {
    backgroundColor: PIZZARIA_COLORS.gold,
    borderColor: '#FEF08A',
  },
  timelineCircleCurrent: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  timelineConnector: {
    width: 2.5,
    flex: 1,
    minHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 2,
  },
  timelineConnectorDone: {
    backgroundColor: PIZZARIA_COLORS.gold,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 12,
  },
  timelineStepTitle: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 13.5,
    fontWeight: '700',
  },
  timelineStepTitleDone: {
    color: PIZZARIA_COLORS.gold,
    fontWeight: '900',
  },
  timelineStepSub: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  currentStageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.gold,
  },
  currentStageBadgeText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
  },
  simulatedMapOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  simulatedMapCanvas: {
    height: 195,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
  },
  mapRoadHorizontalTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '34%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapRoadHorizontalBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '72%',
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapRoadVerticalLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '26%',
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapRoadVerticalRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '68%',
    width: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapRouteDashedLine: {
    position: 'absolute',
    left: '18%',
    top: '30%',
    width: '58%',
    height: 3,
    backgroundColor: PIZZARIA_COLORS.gold,
    transform: [{ rotate: '22deg' }],
    opacity: 0.75,
  },
  mapPinWrap: {
    position: 'absolute',
    zIndex: 5,
  },
  mapPinEmoji: {
    fontSize: 14,
  },
  originPinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.fireOrange,
  },
  originPinText: {
    color: '#FED7AA',
    fontSize: 11,
    fontWeight: '800',
  },
  courierPinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PIZZARIA_COLORS.gold,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  courierPinText: {
    color: '#111827',
    fontSize: 11.5,
    fontWeight: '900',
  },
  homePinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#ECFDF5',
  },
  homePinText: {
    color: '#064E3B',
    fontSize: 11.5,
    fontWeight: '900',
  },
  mapTelemetryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  telemetryAddress: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  telemetryCoords: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  jsonToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: PIZZARIA_COLORS.goldBorder,
  },
  jsonToggleText: {
    color: PIZZARIA_COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
  },
});
