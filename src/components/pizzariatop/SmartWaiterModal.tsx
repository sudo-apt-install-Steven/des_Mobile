import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  AiPizzaSuggestion,
  Combo,
  Sabor,
  formatCurrency,
  getCombos,
  getSabores,
  parseAiSuggestion,
  sendAiChat,
} from '../../services/pizzariatopApi';
import {
  getPizzaImageSource,
  getPizzaRichDescription,
  normalizePizzaText,
} from '../../utils/pizzaImageMap';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { usePizzariaTop } from './PizzariaTopContext';

export interface SmartWaiterModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ChatCartOffer {
  id_produto: number;
  tipo_item: string;
  nome: string;
  detalhes: string;
  preco_unitario: number;
  imagemNome: string;
  imagemUrl?: string | null;
}

interface ChatMessage {
  id: string;
  role: 'model' | 'user';
  text: string;
  offer?: ChatCartOffer | null;
  added?: boolean;
}

const QUICK_PROMPTS = [
  'Qual a mais pedida?',
  'Sugira uma pizza doce',
  'Meio a meio especial',
  'Tem combo promocional?',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-ai',
  role: 'model',
  text: 'Olá! Sou o assistente de IA da Pizzaria TOP 🍕✨. Posso indicar os sabores campeões, montar uma meio a meio ou sugerir uma pizza doce!',
};

function buildOfferFromAiJson(
  suggestion: AiPizzaSuggestion,
  saboresCatalog: Sabor[]
): ChatCartOffer {
  const saborNames = (suggestion.sabores ?? []).map((s) => s.nome).filter(Boolean);
  const tamanhoNome = suggestion.tamanho?.nome || 'Grande (8 fatias)';
  const basePrice = Number(suggestion.tamanho?.preco ?? 45);
  const saboresExtra = (suggestion.sabores ?? []).reduce(
    (acc, s) => acc + Number(s.preco ?? 0),
    0
  );
  const bordaExtra = Number(suggestion.borda?.preco ?? 0);
  const massaExtra = Number(suggestion.massa?.preco ?? 0);
  const finalPrice = Math.max(29.9, basePrice + saboresExtra + bordaExtra + massaExtra);

  const primaryName = saborNames[0] || 'Calabresa Especial';
  const matched = saboresCatalog.find(
    (s) => normalizePizzaText(s.nome_sabor) === normalizePizzaText(primaryName)
  );

  const detalhesParts = [
    `Tamanho: ${tamanhoNome}`,
    suggestion.massa?.nome ? `Massa: ${suggestion.massa.nome}` : 'Massa Tradicional',
    suggestion.borda?.nome ? `Borda: ${suggestion.borda.nome}` : null,
  ].filter(Boolean);

  return {
    id_produto: Number(matched?.id_sabor ?? matched?.id ?? suggestion.sabores?.[0]?.id ?? 1),
    tipo_item: 'pizza_ia',
    nome:
      saborNames.length > 1
        ? `Pizza IA: ${saborNames.join(' + ')}`
        : `Pizza ${primaryName} (${tamanhoNome})`,
    detalhes: detalhesParts.join(' · '),
    preco_unitario: Number(finalPrice.toFixed(2)),
    imagemNome: primaryName,
    imagemUrl: matched?.imagem_url ?? null,
  };
}

function buildSmartFallbackReply(
  prompt: string,
  sabores: Sabor[],
  combos: Combo[]
): { text: string; offer: ChatCartOffer } {
  const q = normalizePizzaText(prompt);
  const cleanSabores = sabores.filter((s) => {
    const n = normalizePizzaText(s.nome_sabor);
    return n && !n.includes('teste') && !n.includes('test');
  });

  // 1. Pizzas Doces
  if (
    q.includes('doce') ||
    q.includes('sobremesa') ||
    q.includes('chocolate') ||
    q.includes('morango') ||
    q.includes('banana') ||
    q.includes('romeu')
  ) {
    const doces = cleanSabores.filter((s) => {
      const cat = normalizePizzaText(s.categoria_sabor);
      const n = normalizePizzaText(s.nome_sabor);
      return (
        cat === 'doce' ||
        n.includes('chocolate') ||
        n.includes('morango') ||
        n.includes('banana') ||
        n.includes('romeu') ||
        n.includes('brigadeiro')
      );
    });
    const chosen = doces[0] ?? cleanSabores[0];
    const nome = chosen?.nome_sabor || 'Chocolate Branco com Morango';
    const extra = Number(chosen?.preco_adicional ?? 4);
    const preco = Number((38.9 + (Number.isNaN(extra) ? 0 : extra)).toFixed(2));
    return {
      text: `Para adoçar a noite, minha recomendação número 1 do cardápio é a **${nome}**! 🍫🍓\n\n${getPizzaRichDescription(
        nome,
        chosen?.descricao
      )}\n\nPreparei ela no tamanho Média com massa leve artesanal para você adicionar em 1 clique:`,
      offer: {
        id_produto: Number(chosen?.id_sabor ?? chosen?.id ?? 101),
        tipo_item: 'pizza_ia',
        nome: `Pizza Média · ${nome}`,
        detalhes: 'Sugestão Garçom IA · Massa Artesanal · 6 fatias',
        preco_unitario: preco,
        imagemNome: nome,
        imagemUrl: chosen?.imagem_url,
      },
    };
  }

  // 2. Meio a meio especial
  if (q.includes('meio') || q.includes('metade') || q.includes('dois') || q.includes('divid')) {
    const salgadas = cleanSabores.filter((s) => normalizePizzaText(s.categoria_sabor) !== 'doce');
    const first =
      salgadas.find((s) => normalizePizzaText(s.nome_sabor).includes('calabresa')) ??
      salgadas[0];
    const second =
      salgadas.find(
        (s) =>
          (normalizePizzaText(s.nome_sabor).includes('queijos') ||
            normalizePizzaText(s.nome_sabor).includes('frango') ||
            normalizePizzaText(s.nome_sabor).includes('peperoni') ||
            normalizePizzaText(s.nome_sabor).includes('pepperoni')) &&
          s !== first
      ) ?? salgadas[1];

    const n1 = first?.nome_sabor || 'Calabresa Artesanal';
    const n2 = second?.nome_sabor || 'Quatro Queijos';
    const extra =
      (Number(first?.preco_adicional ?? 0) + Number(second?.preco_adicional ?? 0)) / 2;
    const preco = Number((49.9 + (Number.isNaN(extra) ? 0 : extra)).toFixed(2));

    return {
      text: `Combinação perfeita do nosso forno! 🔥\n\nMontei uma **Pizza Grande Meio a Meio**: metade **${n1}** e metade **${n2}**, com **Borda Recheada de Catupiry** para equilibrar crocância e cremosidade!`,
      offer: {
        id_produto: Number(first?.id_sabor ?? first?.id ?? 102),
        tipo_item: 'pizza_ia',
        nome: `Grande 1/2 ${n1} + 1/2 ${n2}`,
        detalhes: '8 fatias · Massa Tradicional · Borda Catupiry inclusa',
        preco_unitario: preco,
        imagemNome: n1,
        imagemUrl: first?.imagem_url,
      },
    };
  }

  // 3. Combos em promoção
  if (q.includes('combo') || q.includes('oferta') || q.includes('promocao') || q.includes('barat')) {
    const combo = combos[0];
    if (combo) {
      const cName = combo.nome_combo || combo.nome || 'Combo Família TOP';
      const cPrice = Number(combo.preco_combo ?? combo.preco ?? 59.9);
      return {
        text: `Olha essa oferta ativa direto da cozinha: **${cName}**! 🎉\n\n${
          combo.descricao || 'Excelente custo-benefício para compartilhar com toda a turma.'
        }`,
        offer: {
          id_produto: Number(combo.id_combo ?? combo.id ?? 201),
          tipo_item: 'combo',
          nome: cName,
          detalhes: combo.descricao || 'Combo Promocional Pizzaria TOP',
          preco_unitario: Number.isNaN(cPrice) || cPrice <= 0 ? 59.9 : cPrice,
          imagemNome: cName,
          imagemUrl: combo.imagem_url,
        },
      };
    }
  }

  // 4. Match direto por sabor mencionado ou Mais Pedida / Destaque
  const directMatch = cleanSabores.find((s) => {
    const sn = normalizePizzaText(s.nome_sabor);
    return sn.split(/\s+/).some((word) => word.length >= 4 && q.includes(word));
  });

  const featured =
    directMatch ??
    cleanSabores.find((s) => s.destaque === 1 || s.destaque === true) ??
    cleanSabores.find((s) => normalizePizzaText(s.nome_sabor).includes('frango')) ??
    cleanSabores[0];

  const nome = featured?.nome_sabor || 'Frango com Catupiry';
  const extra = Number(featured?.preco_adicional ?? 0);
  const preco = Number((45 + (Number.isNaN(extra) ? 0 : extra)).toFixed(2));

  return {
    text: `A campeã absoluta de pedidos hoje na Pizzaria TOP é a **${nome}**! 🏆🍕\n\n${getPizzaRichDescription(
      nome,
      featured?.descricao
    )}\n\nJá deixei pronta na versão **Grande (8 fatias)** caso queira colocar direto no carrinho:`,
    offer: {
      id_produto: Number(featured?.id_sabor ?? featured?.id ?? 1),
      tipo_item: 'pizza_ia',
      nome: `Pizza Grande · ${nome}`,
      detalhes: '8 fatias · Campeã de Pedidos · Massa Artesanal',
      preco_unitario: preco,
      imagemNome: nome,
      imagemUrl: featured?.imagem_url,
    },
  };
}

export function SmartWaiterModal({ visible, onClose }: SmartWaiterModalProps) {
  const { addToCart } = usePizzariaTop();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [saboresCache, setSaboresCache] = useState<Sabor[]>([]);
  const [combosCache, setCombosCache] = useState<Combo[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    if (saboresCache.length === 0) {
      Promise.allSettled([getSabores(true), getCombos()]).then(([sabRes, combRes]) => {
        if (!active) return;
        if (sabRes.status === 'fulfilled') setSaboresCache(sabRes.value);
        if (combRes.status === 'fulfilled') setCombosCache(combRes.value);
      });
    }
    return () => {
      active = false;
    };
  }, [visible, saboresCache.length]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const handleSend = useCallback(
    async (presetText?: string) => {
      const textToSend = (presetText ?? input).trim();
      if (!textToSend || thinking) return;

      if (!presetText) setInput('');

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: textToSend,
      };

      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.text,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);
      scrollToBottom();

      try {
        const apiRes = await sendAiChat({
          message: textToSend,
          history: historyPayload,
        });

        const rawReply =
          apiRes?.response ??
          apiRes?.reply ??
          apiRes?.data?.response ??
          apiRes?.data?.reply ??
          apiRes?.message ??
          '';

        if (rawReply.trim()) {
          const { cleanText, suggestion } = parseAiSuggestion(rawReply);
          let offer: ChatCartOffer | null = null;
          if (suggestion) {
            offer = buildOfferFromAiJson(suggestion, saboresCache);
          } else {
            // Cria oferta inteligente complementar baseada na resposta ou pedido do cliente
            offer = buildSmartFallbackReply(`${textToSend} ${cleanText}`, saboresCache, combosCache).offer;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'model',
              text: cleanText || 'Preparei uma sugestão personalizada para você!',
              offer,
            },
          ]);
        } else {
          const smart = buildSmartFallbackReply(textToSend, saboresCache, combosCache);
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'model',
              text: smart.text,
              offer: smart.offer,
            },
          ]);
        }
      } catch {
        // 401 sem login ou indisponibilidade momentânea da IA: responde com curadoria real do cardápio!
        const smart = buildSmartFallbackReply(textToSend, saboresCache, combosCache);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'model',
            text: smart.text,
            offer: smart.offer,
          },
        ]);
      } finally {
        setThinking(false);
        scrollToBottom();
      }
    },
    [input, thinking, messages, saboresCache, combosCache, scrollToBottom]
  );

  const handleAddOffer = (msgId: string, offer: ChatCartOffer) => {
    addToCart({
      id_produto: offer.id_produto,
      tipo_item: offer.tipo_item,
      nome: offer.nome,
      detalhes: offer.detalhes,
      quantidade: 1,
      preco_unitario: offer.preco_unitario,
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, added: true } : m))
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.chatModalCard} onPress={(e) => e.stopPropagation()}>
            {/* Header do Garçom Inteligente */}
            <View style={styles.chatHeaderBar}>
              <View style={[styles.rowGap, { flex: 1 }]}>
                <View style={styles.chatBotAvatar}>
                  <FontAwesome5 name="robot" size={18} color="#111827" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    Garçom Inteligente ✨
                  </Text>
                  <Text style={[styles.authSubtitle, { color: '#FDE68A' }]} numberOfLines={1}>
                    IA Pizzaria TOP · Cardápio ao Vivo
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onClose}
                activeOpacity={0.75}
                accessibilityLabel="Fechar Garçom Inteligente"
              >
                <Feather name="x" size={17} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Histórico de mensagens */}
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    style={isUser ? styles.chatBubbleUser : styles.chatBubbleAi}
                  >
                    <Text
                      style={isUser ? styles.chatBubbleTextUser : styles.chatBubbleTextAi}
                    >
                      {msg.text}
                    </Text>

                    {!isUser && msg.offer ? (
                      <View style={styles.chatSuggestionCard}>
                        <View style={styles.menuItemRow}>
                          <View style={[styles.menuThumb, { width: 54, height: 54 }]}>
                            <Image
                              source={getPizzaImageSource(
                                msg.offer.imagemNome,
                                msg.offer.imagemUrl
                              )}
                              style={styles.menuThumbImg}
                              resizeMode="cover"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemTitle, { fontSize: 13.5 }]} numberOfLines={2}>
                              {msg.offer.nome}
                            </Text>
                            <Text style={[styles.itemDesc, { fontSize: 11.5 }]} numberOfLines={2}>
                              {msg.offer.detalhes}
                            </Text>
                            <Text style={[styles.priceText, { fontSize: 14, marginTop: 3 }]}>
                              {formatCurrency(msg.offer.preco_unitario)}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.rowGap, { marginTop: 10 }]}>
                          <TouchableOpacity
                            style={[
                              styles.goldCtaBtn,
                              {
                                flex: 1,
                                paddingVertical: 9,
                                paddingHorizontal: 12,
                                backgroundColor: msg.added
                                  ? PIZZARIA_COLORS.emerald
                                  : PIZZARIA_COLORS.gold,
                              },
                            ]}
                            onPress={() => handleAddOffer(msg.id, msg.offer!)}
                            activeOpacity={0.85}
                          >
                            <Feather
                              name={msg.added ? 'check-circle' : 'shopping-cart'}
                              size={14}
                              color={msg.added ? '#FFFFFF' : '#111827'}
                            />
                            <Text
                              style={[
                                styles.goldCtaText,
                                {
                                  fontSize: 12,
                                  color: msg.added ? '#FFFFFF' : '#111827',
                                },
                              ]}
                            >
                              {msg.added
                                ? 'Adicionado! (+1)'
                                : 'Adicionar Sugestão ao Carrinho'}
                            </Text>
                          </TouchableOpacity>

                          {msg.added ? (
                            <TouchableOpacity
                              style={[styles.ghostBtn, { paddingVertical: 9, paddingHorizontal: 11 }]}
                              onPress={() => {
                                onClose();
                                router.replace('/Atividade15_PizzariaTop/pedidos' as any);
                              }}
                              activeOpacity={0.8}
                            >
                              <Feather name="arrow-right" size={14} color={PIZZARIA_COLORS.gold} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {thinking ? (
                <View style={[styles.chatBubbleAi, styles.rowGap]}>
                  <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                  <Text style={[styles.chatBubbleTextAi, { color: '#FDE68A' }]}>
                    Pensando na melhor sugestão...
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Chips Rápidos */}
            <View style={styles.chatQuickChipsWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 7 }}
              >
                {QUICK_PROMPTS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.chatPromptChip}
                    onPress={() => handleSend(chip)}
                    disabled={thinking}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chatPromptChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Campo de Envio */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Peça uma sugestão ao Garçom IA..."
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={input}
                onChangeText={setInput}
                editable={!thinking}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, { opacity: thinking || !input.trim() ? 0.55 : 1 }]}
                onPress={() => handleSend()}
                disabled={thinking || !input.trim()}
                activeOpacity={0.85}
                accessibilityLabel="Enviar mensagem para a IA"
              >
                <Feather name="send" size={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
