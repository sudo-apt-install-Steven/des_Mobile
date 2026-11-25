import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackBannerProps {
  type: FeedbackType;
  message: string;
  onDismiss?: () => void;
}

const FEEDBACK_CONFIG: Record<
  FeedbackType,
  {
    icon: keyof typeof Feather.glyphMap;
    color: string;
    containerStyle: object;
  }
> = {
  success: {
    icon: 'check-circle',
    color: PIZZARIA_COLORS.emerald,
    containerStyle: styles.feedbackSuccess,
  },
  error: {
    icon: 'alert-circle',
    color: PIZZARIA_COLORS.red,
    containerStyle: styles.feedbackError,
  },
  info: {
    icon: 'info',
    color: PIZZARIA_COLORS.gold,
    containerStyle: styles.feedbackInfo,
  },
};

export function FeedbackBanner({ type, message, onDismiss }: FeedbackBannerProps) {
  if (!message) return null;

  const cfg = FEEDBACK_CONFIG[type];

  return (
    <View style={[styles.feedbackBanner, cfg.containerStyle]} accessibilityRole="alert">
      <View style={styles.feedbackIconBox}>
        <Feather name={cfg.icon} size={16} color={cfg.color} />
      </View>
      <Text style={styles.feedbackText}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity
          style={styles.feedbackCloseBtn}
          onPress={onDismiss}
          activeOpacity={0.7}
          accessibilityLabel="Fechar aviso"
        >
          <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
