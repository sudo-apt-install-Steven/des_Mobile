import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
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

export default function PedidosScreen() {
  const { user, cart, cartSubtotal, updateCartQty, removeFromCart, clearCart } =
    usePizzariaTop();

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

  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');

  const taxaEntrega = 5;
  const totalFinal = useMemo(
    () => Math.max(0, cartSubtotal + (cart.length > 0 ? taxaEntrega : 0) - descontoValor),
    [cart.length, cartSubtotal, descontoValor]
  );

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
        setPedidos(pedidosRes.value);
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
  }, [user]);

  useEffect(() => {
    carregarDadosPedidos();
  }, [carregarDadosPedidos]);

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
          const createdId = Number(endCreated?.id_endereco ?? endCreated?.data?.id_endereco ?? endCreated?.id);
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

      const createdPedidoId = res?.id_pedido ?? res?.data?.id_pedido ?? res?.id;
      clearCart();
      setDescontoValor(0);
      setCupomInput('');
      setObservacoes('');
      setFeedback(
        createdPedidoId
          ? `Pedido #${createdPedidoId} enviado com sucesso!`
          : 'Pedido enviado com sucesso!'
      );
      await carregarDadosPedidos();
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao finalizar pedido na API.'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleRastrear = async (idPedido: number) => {
    setTrackingPedidoId(idPedido);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const data = await getTracking(idPedido);
      setTrackingData(data);
    } catch (e) {
      setFeedback(extractErrorMessage(e, `Erro ao rastrear pedido #${idPedido}.`));
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <PizzariaTopShell activeTab="pedidos" subtitle="Carrinho, Entrega & Tracking">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrap}>
          {/* Tempo de entrega */}
          <View style={[styles.glassCard, styles.glassCardGold]}>
            <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
              <View style={styles.rowGap}>
                <Feather name="clock" size={18} color={PIZZARIA_COLORS.gold} />
                <View>
                  <Text style={styles.itemTitle}>Tempo Estimado de Entrega</Text>
                  <Text style={styles.itemDesc}>Calculado via GET /tempo_entrega</Text>
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
                Nenhum item no carrinho. Monte sua pizza personalizada ou escolha um combo na vitrine.
              </Text>
              <TouchableOpacity
                style={styles.goldCtaBtn}
                onPress={() => router.replace('/Atividade15_PizzariaTop/montar')}
              >
                <FontAwesome5 name="pizza-slice" size={13} color="#111827" />
                <Text style={styles.goldCtaText}>Ir para Montar Pizza</Text>
              </TouchableOpacity>
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

              {/* CEP e Endereço */}
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
                    <Text style={styles.itemDesc}>{formatCurrency(taxaEntrega)}</Text>
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
            </>
          )}

          {/* Rastreamento ativo */}
          {trackingPedidoId !== null && (
            <View style={[styles.glassCard, styles.glassCardGold]}>
              <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 8 }]}>
                <Text style={styles.itemTitle}>
                  Rastreamento Pedido #{trackingPedidoId}
                </Text>
                <TouchableOpacity onPress={() => setTrackingPedidoId(null)}>
                  <Feather name="x" size={18} color={PIZZARIA_COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              {trackingLoading ? (
                <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
              ) : trackingData ? (
                <View style={styles.jsonBox}>
                  <Text style={styles.jsonText}>
                    {JSON.stringify(trackingData, null, 2)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.itemDesc}>Sem dados de rastreamento disponíveis.</Text>
              )}
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
              const badge = STATUS_BADGE_COLORS[statusKey] ?? {
                bg: 'rgba(255,255,255,0.1)',
                fg: '#E2E8F0',
              };
              return (
                <View key={`ped-${pid}`} style={styles.glassCard}>
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
                      style={styles.ghostBtn}
                      onPress={() => handleRastrear(pid)}
                    >
                      <Feather name="map-pin" size={13} color={PIZZARIA_COLORS.gold} />
                      <Text style={styles.ghostBtnText}>Rastrear</Text>
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
