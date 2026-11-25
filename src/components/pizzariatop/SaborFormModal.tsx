import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Sabor,
  SaborCategoria,
  SaborPayload,
} from '../../services/pizzariatopApi';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { FeedbackBanner } from './FeedbackBanner';

export interface SaborFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialSabor?: Sabor | null;
  loading?: boolean;
  fetchingDetails?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  onCancel: () => void;
  onSubmit: (payload: SaborPayload) => Promise<void> | void;
}

const CATEGORIAS: { value: SaborCategoria; label: string }[] = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'especial', label: 'Especial' },
  { value: 'premium', label: 'Premium' },
  { value: 'doce', label: 'Doce' },
];

function toBooleanFlag(val: unknown, fallback: boolean): boolean {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return Boolean(val);
}

function normalizeCategoria(value?: string | null): SaborCategoria {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (
    normalized === 'tradicional' ||
    normalized === 'especial' ||
    normalized === 'premium' ||
    normalized === 'doce'
  ) {
    return normalized;
  }
  return 'tradicional';
}

export function SaborFormModal({
  visible,
  mode,
  initialSabor,
  loading = false,
  fetchingDetails = false,
  errorMessage,
  onClearError,
  onCancel,
  onSubmit,
}: SaborFormModalProps) {
  const [nomeSabor, setNomeSabor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaSabor, setCategoriaSabor] = useState<SaborCategoria>('tradicional');
  const [precoAdicional, setPrecoAdicional] = useState('0');
  const [imagemUrl, setImagemUrl] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setValidationError(null);
    if (mode === 'edit' && initialSabor) {
      setNomeSabor(initialSabor.nome_sabor ?? '');
      setDescricao(initialSabor.descricao ?? '');
      setCategoriaSabor(normalizeCategoria(initialSabor.categoria_sabor));
      const precoNum = Number(initialSabor.preco_adicional ?? 0);
      setPrecoAdicional(Number.isNaN(precoNum) ? '0' : String(precoNum));
      setImagemUrl(initialSabor.imagem_url ?? '');
      setDisponivel(toBooleanFlag(initialSabor.disponivel, true));
      setDestaque(toBooleanFlag(initialSabor.destaque, false));
    } else {
      setNomeSabor('');
      setDescricao('');
      setCategoriaSabor('tradicional');
      setPrecoAdicional('0');
      setImagemUrl('');
      setDisponivel(true);
      setDestaque(false);
    }
  }, [visible, mode, initialSabor]);

  const handleConfirm = async () => {
    setValidationError(null);
    onClearError?.();

    const trimmedName = nomeSabor.trim();
    if (!trimmedName) {
      setValidationError('Informe o nome do sabor (campo obrigatório).');
      return;
    }

    const parsedPreco = Number(precoAdicional.trim().replace(',', '.') || '0');
    if (Number.isNaN(parsedPreco) || parsedPreco < 0) {
      setValidationError('Informe um preço adicional numérico válido (maior ou igual a 0).');
      return;
    }

    const payload: SaborPayload = {
      nome_sabor: trimmedName,
      descricao: descricao.trim(),
      categoria_sabor: categoriaSabor,
      preco_adicional: parsedPreco,
      disponivel,
      destaque,
    };

    const trimmedImg = imagemUrl.trim();
    if (trimmedImg) {
      payload.imagem_url = trimmedImg;
    }

    await onSubmit(payload);
  };

  const saborId = initialSabor?.id_sabor ?? initialSabor?.id;
  const activeError = validationError || errorMessage || null;
  const isBusy = loading || fetchingDetails;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!loading) onCancel();
          }}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.rowGap, { gap: 8, marginBottom: 4 }]}>
                  <View
                    style={[
                      styles.httpPill,
                      {
                        backgroundColor:
                          mode === 'create'
                            ? 'rgba(34, 197, 94, 0.16)'
                            : 'rgba(245, 158, 11, 0.16)',
                        borderColor:
                          mode === 'create'
                            ? PIZZARIA_COLORS.basilBorder
                            : PIZZARIA_COLORS.goldBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.httpPillText,
                        {
                          color:
                            mode === 'create'
                              ? PIZZARIA_COLORS.emerald
                              : PIZZARIA_COLORS.gold,
                        },
                      ]}
                    >
                      {mode === 'create' ? 'POST' : 'PUT'}
                    </Text>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {mode === 'create' ? 'Novo Sabor' : 'Editar Sabor'}
                  </Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  {mode === 'create'
                    ? 'POST /api/sabores · Cadastra um sabor no cardápio'
                    : `PUT /api/sabores/${saborId ?? ':id'} · Atualiza dados do sabor`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel="Fechar formulário de sabor"
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.modalBody}
            >
              {fetchingDetails ? (
                <View
                  style={[
                    styles.feedbackBanner,
                    styles.feedbackInfo,
                    { paddingVertical: 9 },
                  ]}
                >
                  <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
                  <Text style={styles.feedbackText}>
                    Consultando GET /api/sabores/{saborId} para carregar dados atualizados...
                  </Text>
                </View>
              ) : null}

              {activeError ? (
                <FeedbackBanner
                  type="error"
                  message={activeError}
                  onDismiss={() => {
                    setValidationError(null);
                    onClearError?.();
                  }}
                />
              ) : null}

              <Text style={styles.inputLabel}>Nome do sabor *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Calabresa Artesanal"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={nomeSabor}
                onChangeText={setNomeSabor}
                editable={!isBusy}
              />

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Molho de tomate pelati, muçarela, calabresa fatiada e cebola roxa..."
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={descricao}
                onChangeText={setDescricao}
                editable={!isBusy}
              />

              <Text style={styles.inputLabel}>Categoria do sabor</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {CATEGORIAS.map((cat) => {
                  const selected = categoriaSabor === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.filterChip,
                        selected && styles.filterChipActive,
                      ]}
                      onPress={() => setCategoriaSabor(cat.value)}
                      disabled={isBusy}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selected && styles.filterChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Preço adicional (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                keyboardType="decimal-pad"
                value={precoAdicional}
                onChangeText={setPrecoAdicional}
                editable={!isBusy}
              />

              <Text style={styles.inputLabel}>URL da imagem (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://... ou /images/pizza.png"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={imagemUrl}
                onChangeText={setImagemUrl}
                editable={!isBusy}
              />

              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalSwitchLabel}>Disponível no cardápio</Text>
                  <Text style={styles.authSubtitle}>
                    Controla se o sabor aparece ativo para pedidos
                  </Text>
                </View>
                <Switch
                  value={disponivel}
                  onValueChange={setDisponivel}
                  disabled={isBusy}
                  trackColor={{
                    false: 'rgba(255, 237, 213, 0.16)',
                    true: 'rgba(22, 163, 74, 0.65)',
                  }}
                  thumbColor={disponivel ? PIZZARIA_COLORS.emerald : PIZZARIA_COLORS.textMuted}
                />
              </View>

              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalSwitchLabel}>Sabor em destaque</Text>
                  <Text style={styles.authSubtitle}>
                    Exibe selo de destaque na vitrine da pizzaria
                  </Text>
                </View>
                <Switch
                  value={destaque}
                  onValueChange={setDestaque}
                  disabled={isBusy}
                  trackColor={{
                    false: 'rgba(255, 237, 213, 0.16)',
                    true: 'rgba(245, 158, 11, 0.65)',
                  }}
                  thumbColor={destaque ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryCtaBtn,
                  { flex: 1.4, opacity: isBusy ? 0.7 : 1 },
                ]}
                onPress={handleConfirm}
                disabled={isBusy}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF7ED" />
                ) : (
                  <>
                    <Feather
                      name={mode === 'create' ? 'plus-circle' : 'save'}
                      size={15}
                      color="#FFF7ED"
                    />
                    <Text style={styles.primaryCtaText}>
                      {mode === 'create' ? 'Cadastrar Sabor' : 'Salvar Alterações'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
