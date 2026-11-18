import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import {
  Endereco,
  Recompensa,
  extractErrorMessage,
  getEnderecos,
  getRecompensas,
  login,
  registerUser,
  resgatarRecompensa,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { usePizzariaTop } from '../../components/pizzariatop/PizzariaTopContext';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

export default function PerfilScreen() {
  const { user, topCoins, setSession, refreshSession, logoutSession, setTopCoins } =
    usePizzariaTop();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);

  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');

  const carregarContaEClube = useCallback(async () => {
    setLoadingExtras(true);
    try {
      const [recRes, endRes] = await Promise.allSettled([
        getRecompensas(),
        user ? getEnderecos() : Promise.resolve([] as Endereco[]),
      ]);
      if (recRes.status === 'fulfilled') setRecompensas(recRes.value);
      if (endRes.status === 'fulfilled') setEnderecos(endRes.value);
    } finally {
      setLoadingExtras(false);
    }
  }, [user]);

  useEffect(() => {
    carregarContaEClube();
  }, [carregarContaEClube]);

  const handleLogin = async () => {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setAuthLoading(true);
    setErro('');
    setFeedback('');
    try {
      const res = await login({
        email: email.trim(),
        senha,
        device_id: 'expo-mobile-atividade15',
      });
      const loggedUser = res?.data?.user ?? res?.user;
      const tok = res?.data?.token ?? res?.token ?? null;
      if (loggedUser) {
        setSession(loggedUser, tok);
      }
      await refreshSession();
      setFeedback(`Bem-vindo(a), ${loggedUser?.nome ?? email.trim()}!`);
      setSenha('');
    } catch (e) {
      setErro(extractErrorMessage(e, 'Falha ao autenticar na PizzariaTop.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      setErro('Preencha nome, e-mail e senha com pelo menos 6 caracteres.');
      return;
    }
    setAuthLoading(true);
    setErro('');
    setFeedback('');
    try {
      await registerUser({ nome: nome.trim(), email: email.trim(), senha });
      setFeedback('Conta criada com sucesso! Agora faça login.');
      setAuthMode('login');
      setSenha('');
    } catch (e) {
      setErro(extractErrorMessage(e, 'Não foi possível criar a conta.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    setErro('');
    setFeedback('');
    await logoutSession();
    setEnderecos([]);
    setAuthLoading(false);
    setFeedback('Sessão encerrada com sucesso.');
  };

  const handleResgatar = async (rec: Recompensa) => {
    const id = Number(rec.id_recompensa ?? rec.id);
    if (!id) return;
    if (!user) {
      setErro('Faça login para resgatar recompensas.');
      return;
    }
    setRedeemingId(id);
    setErro('');
    setFeedback('');
    try {
      await resgatarRecompensa(id);
      const custo = Number(rec.pontos_necessarios ?? rec.custo_pontos ?? 0);
      if (custo > 0) setTopCoins(Math.max(0, topCoins - custo));
      setFeedback(`Recompensa "${rec.nome ?? rec.titulo}" resgatada!`);
    } catch (e) {
      setErro(extractErrorMessage(e, 'Erro ao resgatar recompensa.'));
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <PizzariaTopShell activeTab="perfil" subtitle="Conta, Endereços & Clube Top">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrap}>
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

          {/* Autenticação ou Perfil */}
          {!user ? (
            <View style={styles.glassCard}>
              <View style={[styles.rowGap, { marginBottom: 14 }]}>
                <TouchableOpacity
                  style={[styles.stepChip, authMode === 'login' && styles.stepChipActive]}
                  onPress={() => {
                    setAuthMode('login');
                    setErro('');
                  }}
                >
                  <Text style={[styles.stepChipText, authMode === 'login' && styles.stepChipTextActive]}>
                    Entrar (POST /auth/login)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepChip, authMode === 'register' && styles.stepChipActive]}
                  onPress={() => {
                    setAuthMode('register');
                    setErro('');
                  }}
                >
                  <Text style={[styles.stepChipText, authMode === 'register' && styles.stepChipTextActive]}>
                    Criar Conta (/create-user)
                  </Text>
                </TouchableOpacity>
              </View>

              {authMode === 'register' && (
                <>
                  <Text style={styles.inputLabel}>Nome completo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome (somente letras)"
                    placeholderTextColor={PIZZARIA_COLORS.textMuted}
                    value={nome}
                    onChangeText={setNome}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="email@exemplo.com"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />

              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={authMode === 'login' ? handleLogin : handleCadastro}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather
                      name={authMode === 'login' ? 'log-in' : 'user-plus'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryCtaText}>
                      {authMode === 'login' ? 'Entrar' : 'Cadastrar Cliente'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.glassCard, styles.glassCardGold]}>
              <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 10 }]}>
                <View style={styles.rowGap}>
                  <View style={styles.brandIconBox}>
                    <Feather name="user" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>{user.nome}</Text>
                    <Text style={styles.itemDesc}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{user.tipo_usuario ?? 'cliente'}</Text>
                </View>
              </View>

              <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 14 }]}>
                <Text style={styles.itemDesc}>Saldo Clube Top:</Text>
                <Text style={styles.priceText}>{topCoins} TopCoins</Text>
              </View>

              <View style={styles.rowGap}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1 }]}
                  onPress={() => refreshSession()}
                >
                  <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                  <Text style={styles.ghostBtnText}>Atualizar (/auth/me)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.ghostBtn,
                    { flex: 1, borderColor: 'rgba(239, 68, 68, 0.45)' },
                  ]}
                  onPress={handleLogout}
                  disabled={authLoading}
                >
                  <Feather name="log-out" size={14} color="#FCA5A5" />
                  <Text style={[styles.ghostBtnText, { color: '#FCA5A5' }]}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Endereços */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Meus Endereços (GET /enderecos)</Text>
            </View>
            <Text style={styles.sectionMeta}>{enderecos.length}</Text>
          </View>

          {!user ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>Faça login para listar seus endereços salvos.</Text>
            </View>
          ) : enderecos.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>Nenhum endereço cadastrado nesta conta.</Text>
            </View>
          ) : (
            enderecos.map((end, idx) => (
              <View key={`addr-${end.id_endereco ?? end.id ?? idx}`} style={styles.glassCard}>
                <Text style={styles.itemTitle}>
                  {end.logradouro ?? end.rua}, {end.numero}
                </Text>
                <Text style={styles.itemDesc}>
                  {end.bairro} · {end.cidade}
                  {end.estado ? `/${end.estado}` : ''} {end.cep ? `· CEP ${end.cep}` : ''}
                </Text>
              </View>
            ))
          )}

          {/* Recompensas */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.gold }]} />
              <Text style={styles.sectionTitle}>Recompensas (GET /recompensas)</Text>
            </View>
            <Text style={styles.sectionMeta}>{recompensas.length} ativa(s)</Text>
          </View>

          {loadingExtras ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={PIZZARIA_COLORS.gold} />
            </View>
          ) : recompensas.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>Nenhuma recompensa disponível no momento.</Text>
            </View>
          ) : (
            recompensas.map((rec, idx) => {
              const rid = Number(rec.id_recompensa ?? rec.id ?? idx + 1);
              const custo = rec.pontos_necessarios ?? rec.custo_pontos ?? 0;
              return (
                <View key={`rec-${rid}`} style={styles.glassCard}>
                  <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        {rec.nome ?? rec.titulo ?? `Recompensa #${rid}`}
                      </Text>
                      <Text style={styles.itemDesc}>
                        {rec.descricao || 'Troque seus TopCoins acumulados'}
                      </Text>
                      <Text style={[styles.priceText, { marginTop: 6 }]}>
                        {custo} TopCoins
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.goldCtaBtn}
                      onPress={() => handleResgatar(rec)}
                      disabled={redeemingId === rid}
                    >
                      {redeemingId === rid ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <>
                          <FontAwesome5 name="gift" size={13} color="#111827" />
                          <Text style={styles.goldCtaText}>Resgatar</Text>
                        </>
                      )}
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
