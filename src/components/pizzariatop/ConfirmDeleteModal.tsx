import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

export interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  itemName: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  visible,
  title,
  itemName,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          if (!loading) onCancel();
        }}
      >
        <Pressable
          style={[styles.modalCard, { borderColor: PIZZARIA_COLORS.errorBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <View style={[styles.rowGap, { flex: 1 }]}>
              <View
                style={[
                  styles.emptyStateIconBox,
                  {
                    width: 40,
                    height: 40,
                    marginBottom: 0,
                    backgroundColor: 'rgba(239, 68, 68, 0.16)',
                    borderColor: PIZZARIA_COLORS.errorBorder,
                  },
                ]}
              >
                <Feather name="trash-2" size={18} color="#FCA5A5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>Operação DELETE irreversível na API</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.itemDesc, { color: PIZZARIA_COLORS.textSecondary, fontSize: 13.5 }]}>
              Tem certeza que deseja excluir{' '}
              <Text style={{ color: PIZZARIA_COLORS.gold, fontWeight: '800' }}>
                &ldquo;{itemName}&rdquo;
              </Text>
              ?
            </Text>
          </View>

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
              style={[styles.modalConfirmDeleteBtn, loading && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF7ED" />
              ) : (
                <>
                  <Feather name="trash-2" size={15} color="#FFF7ED" />
                  <Text style={styles.modalConfirmDeleteText}>Excluir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
