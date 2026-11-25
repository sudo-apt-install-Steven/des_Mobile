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
  Ingrediente,
  IngredientePayload,
  IngredienteTipo,
} from '../../services/pizzariatopApi';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { FeedbackBanner } from './FeedbackBanner';

export interface IngredienteFormModalProps {
  visible: boolean;
  ingrediente?: Ingrediente | null;
  submitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: IngredientePayload) => Promise<void> | void;
}

export const INGREDIENTE_TIPOS: Array<{
  key: IngredienteTipo;
  label: string;
}> = [
  { key: 'queijos', label: 'Queijos' },
  { key: 'carnes', label: 'Carnes' },
  { key: 'vegetais', label: 'Vegetais' },
  { key: 'doces', label: 'Doces' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'outros', label: 'Outros' },
];

const VALID_TIPOS = new Set<string>(INGREDIENTE_TIPOS.map((t) => t.key));

function normalizeTipo(value?: string | null): IngredienteTipo {
  const lower = String(value ?? '').trim().toLowerCase();
  if (VALID_TIPOS.has(lower)) {
    return lower as IngredienteTipo;
  }
  return 'outros';
}

function normalizeDisponivel(value?: number | boolean): boolean {
  if (value === undefined || value === null) return true;
  return value === true || value === 1;
}

export function IngredienteFormModal({
  visible,
  ingrediente,
  submitting = false,
  errorMessage = null,
  onClose,
  onSubmit,
}: IngredienteFormModalProps) {
  const isEditing = Boolean(ingrediente);

  const [nomeIngrediente, setNomeIngrediente] = useState('');
  const [tipoIngrediente, setTipoIngrediente] = useState<IngredienteTipo>('queijos');
  const [precoAdicional, setPrecoAdicional] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [imagemUrl, setImagemUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setValidationError(null);
    if (ingrediente) {
      setNomeIngrediente(ingrediente.nome_ingrediente ?? '');
      setTipoIngrediente(normalizeTipo(ingrediente.tipo_ingrediente));
      const numPrice = Number(ingrediente.preco_adicional ?? 0);
      setPrecoAdicional(Number.isNaN(numPrice) ? '0.00' : numPrice.toFixed(2));
      setDisponivel(normalizeDisponivel(ingrediente.disponivel));
      setImagemUrl(ingrediente.imagem_url ?? '');
    } else {
      setNomeIngrediente('');
      setTipoIngrediente('queijos');
      setPrecoAdicional('0.00');
      setDisponivel(true);
      setImagemUrl('');
    }
  }, [visible, ingrediente]);

  const handleSave = async () => {
    const trimmedName = nomeIngrediente.trim();
    if (!trimmedName) {
      setValidationError('Informe o nome do ingrediente (campo obrigatório).');
      return;
    }

    const rawPrice = precoAdicional.trim().replace(',', '.');
    const parsedPrice = rawPrice === '' ? 0 : Number(rawPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setValidationError('Informe um preço adicional numérico válido (maior ou igual a zero).');
      return;
    }

    setValidationError(null);

    const payload: IngredientePayload = {
      nome_ingrediente: trimmedName,
      tipo_ingrediente: tipoIngrediente,
      preco_adicional: Number(parsedPrice.toFixed(2)),
      disponivel,
      ...(imagemUrl.trim() ? { imagem_url: imagemUrl.trim() } : { imagem_url: '' }),
    };

    await onSubmit(payload);
  };

  const activeError = validationError || errorMessage;
  const itemId = ingrediente?.id_ingrediente ?? ingrediente?.id;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!submitting) onClose();
          }}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.rowGap, { gap: 8, marginBottom: 4 }]}>
                  <View
                    style={[
                      styles.httpPill,
                      {
                        backgroundColor: isEditing
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(22, 163, 74, 0.18)',
                        borderColor: isEditing
                          ? PIZZARIA_COLORS.goldBorder
                          : PIZZARIA_COLORS.basilBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.httpPillText,
                        { color: isEditing ? PIZZARIA_COLORS.gold : PIZZARIA_COLORS.emerald },
                      ]}
                    >
                      {isEditing ? `PUT /ingredientes/${itemId ?? ''}` : 'POST /ingredientes'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditing
                    ? 'Atualize os dados do ingrediente na API PizzariaTop.'
                    : 'Cadastre um novo ingrediente artesanal no catálogo.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.75}
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeError ? (
                <FeedbackBanner
                  type="error"
                  message={activeError}
                  onDismiss={() => setValidationError(null)}
                />
              ) : null}

              <Text style={styles.inputLabel}>Nome do ingrediente *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Mussarela de Búfala, Bacon Artesanal..."
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={nomeIngrediente}
                onChangeText={(text) => {
                  setNomeIngrediente(text);
                  if (validationError) setValidationError(null);
                }}
                editable={!submitting}
              />

              <Text style={styles.inputLabel}>Tipo do ingrediente *</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {INGREDIENTE_TIPOS.map((tipo) => {
                  const selected = tipoIngrediente === tipo.key;
                  return (
                    <TouchableOpacity
                      key={tipo.key}
                      style={[styles.filterChip, selected && styles.filterChipActive]}
                      onPress={() => setTipoIngrediente(tipo.key)}
                      disabled={submitting}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selected && styles.filterChipTextActive,
                        ]}
                      >
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Preço adicional (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 6.50"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                keyboardType="decimal-pad"
                value={precoAdicional}
                onChangeText={(text) => {
                  setPrecoAdicional(text);
                  if (validationError) setValidationError(null);
                }}
                editable={!submitting}
              />

              <View style={styles.modalSwitchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalSwitchLabel}>Disponível no cardápio</Text>
                  <Text style={styles.authSubtitle}>
                    {disponivel
                      ? 'Ativo para montagem de pizzas e adicionais.'
                      : 'Indisponível temporariamente para pedidos.'}
                  </Text>
                </View>
                <Switch
                  value={disponivel}
                  onValueChange={setDisponivel}
                  disabled={submitting}
                  trackColor={{
                    false: 'rgba(255, 237, 213, 0.16)',
                    true: PIZZARIA_COLORS.basil,
                  }}
                  thumbColor={disponivel ? '#FFF7ED' : '#D6C7BC'}
                />
              </View>

              <Text style={styles.inputLabel}>URL da imagem (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://... ou /uploads/ingrediente.jpg"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={imagemUrl}
                onChangeText={setImagemUrl}
                editable={!submitting}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryCtaBtn, { flex: 1.4, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF7ED" />
                ) : (
                  <>
                    <Feather
                      name={isEditing ? 'save' : 'plus-circle'}
                      size={15}
                      color="#FFF7ED"
                    />
                    <Text style={styles.primaryCtaText}>
                      {isEditing ? 'Salvar Alterações' : 'Cadastrar Ingrediente'}
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
