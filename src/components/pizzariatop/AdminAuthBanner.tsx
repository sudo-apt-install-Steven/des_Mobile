import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { extractErrorMessage, login } from '../../services/pizzariatopApi';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';
import { FeedbackBanner } from './FeedbackBanner';
import { usePizzariaTop } from './PizzariaTopContext';

export interface AdminAuthBannerProps {
  onAuthChange?: () => void;
}

export function AdminAuthBanner({ onAuthChange }: AdminAuthBannerProps) {
  const { user, setSession, refreshSession, logoutSession } = usePizzariaTop();

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isAdmin =
    Boolean(user) &&
    ['admin', 'gerente', 'funcionario'].includes(String(user?.tipo_usuario ?? '').toLowerCase());

  const handleFillDemo = () => {
    setEmail('steven.melos@pizzariatop.com');
    setSenha('123456');
    setModalFeedback({
      type: 'info',
      message: 'Credenciais demo Admin preenchidas. Toque em "Entrar como Admin".',
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha) {
      setModalFeedback({
        type: 'error',
        message: 'Informe e-mail e senha para autenticar.',
      });
      return;
    }

    setLoading(true);
    setModalFeedback(null);
    try {
      const res = await login({
        email: email.trim(),
        senha,
        device_id: 'expo-mobile-atividade15-admin',
      });
      const loggedUser = res?.data?.user ?? res?.user;
      const tok = res?.data?.token ?? res?.token ?? null;
      if (loggedUser) {
        setSession(loggedUser, tok);
      }
      await refreshSession();
      setModalVisible(false);
      setSenha('');
      setBannerFeedback({
        type: 'success',
        message: `Autenticado como ${loggedUser?.nome ?? email.trim()} (${loggedUser?.tipo_usuario ?? 'admin'}).`,
      });
      onAuthChange?.();
    } catch (err) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Não foi possível autenticar na API PizzariaTop.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutSession();
      setBannerFeedback({
        type: 'info',
        message: 'Sessão encerrada. Faça login como Admin para criar, editar ou excluir.',
      });
      onAuthChange?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {bannerFeedback ? (
        <FeedbackBanner
          type={bannerFeedback.type}
          message={bannerFeedback.message}
          onDismiss={() => setBannerFeedback(null)}
        />
      ) : null}

      <View style={[styles.authBanner, isAdmin && styles.authBannerAuthenticated]}>
        <View style={styles.authBannerRow}>
          <View style={[styles.rowGap, { flex: 1 }]}>
            <View
              style={[
                styles.authStatusDot,
                { backgroundColor: isAdmin ? PIZZARIA_COLORS.emerald : PIZZARIA_COLORS.amber },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.authTitle} numberOfLines={1}>
                {isAdmin
                  ? `Admin: ${user?.nome ?? 'Autenticado'}`
                  : user
                  ? `Sessão ${user.tipo_usuario ?? 'cliente'}: ${user.nome}`
                  : 'Sessão Admin desconectada'}
              </Text>
              <Text style={styles.authSubtitle} numberOfLines={2}>
                {isAdmin
                  ? 'Token Bearer ativo para POST, PUT e DELETE na API.'
                  : 'Autentique-se como Admin para liberar POST, PUT e DELETE.'}
              </Text>
            </View>
          </View>

          {user ? (
            <View style={styles.rowGap}>
              {!isAdmin ? (
                <TouchableOpacity
                  style={styles.authActionBtn}
                  onPress={() => {
                    setModalFeedback(null);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="shield" size={13} color="#FFF7ED" />
                  <Text style={styles.authActionBtnText}>Admin</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.authLogoutBtn}
                onPress={handleLogout}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FCA5A5" />
                ) : (
                  <>
                    <Feather name="log-out" size={13} color="#FCA5A5" />
                    <Text style={styles.authLogoutBtnText}>Sair</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.authActionBtn}
              onPress={() => {
                setModalFeedback(null);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Feather name="lock" size={13} color="#FFF7ED" />
              <Text style={styles.authActionBtnText}>Entrar Admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) setModalVisible(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!loading) setModalVisible(false);
          }}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Acesso Administrativo</Text>
                <Text style={styles.modalSubtitle}>
                  POST /auth/login · Gera token Bearer para operações CRUD
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Feather name="x" size={16} color={PIZZARIA_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {modalFeedback ? (
              <FeedbackBanner
                type={modalFeedback.type}
                message={modalFeedback.message}
                onDismiss={() => setModalFeedback(null)}
              />
            ) : null}

            <TouchableOpacity
              style={styles.demoQuickFillBtn}
              onPress={handleFillDemo}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Feather name="zap" size={14} color={PIZZARIA_COLORS.gold} />
              <Text style={styles.demoQuickFillText}>Preencher conta Admin Demo</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="steven.melos@pizzariatop.com"
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor={PIZZARIA_COLORS.textMuted}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              editable={!loading}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryCtaBtn, { flex: 1.4, opacity: loading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF7ED" />
                ) : (
                  <>
                    <Feather name="log-in" size={15} color="#FFF7ED" />
                    <Text style={styles.primaryCtaText}>Entrar como Admin</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
