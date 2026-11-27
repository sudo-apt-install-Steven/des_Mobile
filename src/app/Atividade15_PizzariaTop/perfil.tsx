import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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
import {
  NAV_MODE_OPTIONS,
  PizzariaTopShell,
} from '../../components/pizzariatop/PizzariaTopChrome';
import {
  NavStyleMode,
  usePizzariaTop,
} from '../../components/pizzariatop/PizzariaTopContext';
import { FeedbackBanner } from '../../components/pizzariatop/FeedbackBanner';
import { useResponsive } from '../../hooks/useResponsive';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const NAV_FRIENDLY_LABELS: Record<
  NavStyleMode,
  { displayTitle: string; badge: string }
> = {
  dock: {
    displayTitle: 'Dock Pill Flutuante',
    badge: 'Padrão Oficial',
  },
  classic: {
    displayTitle: 'Barra Clássica Topo',
    badge: 'Horizontal',
  },
  sidebar: {
    displayTitle: 'Sidebar Lateral PC',
    badge: 'PC / Drawer',
  },
  floating: {
    displayTitle: 'Botão Leque Flutuante',
    badge: 'FAB Rápido',
  },
};

function formatNotifDate(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} às ${hh}:${min}`;
}

export default function PerfilScreen() {
  const { width } = useResponsive();
  const {
    user,
    topCoins,
    isVip,
    navStyle,
    setNavStyle,
    notificacoes,
    unreadNotifs,
    refreshNotifs,
    markAllNotifsRead,
    setSession,
    refreshSession,
    logoutSession,
    setTopCoins,
  } = usePizzariaTop();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [markingNotifs, setMarkingNotifs] = useState(false);
  const [refreshingNotifs, setRefreshingNotifs] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');

  const roleLower = String(user?.tipo_usuario ?? '').toLowerCase();
  const isStaff =
    Boolean(user) &&
    (roleLower === 'admin' || roleLower === 'funcionario' || roleLower === 'gerente');
  const themeAccent = isStaff ? PIZZARIA_COLORS.themeStaff : PIZZARIA_COLORS.themeClient;
  const themeAccentBg = isStaff
    ? PIZZARIA_COLORS.themeStaffBg
    : PIZZARIA_COLORS.themeClientBg;

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

  const handleSelectNavMode = (mode: NavStyleMode) => {
    setNavStyle(mode);
    const label = NAV_FRIENDLY_LABELS[mode]?.displayTitle ?? mode;
    setErro('');
    setFeedback(`Estilo de navegação alterado ao vivo para "${label}".`);
  };

  const handleRefreshNotificacoes = async () => {
    setRefreshingNotifs(true);
    await refreshNotifs();
    setRefreshingNotifs(false);
  };

  const handleMarkAllRead = async () => {
    setMarkingNotifs(true);
    setErro('');
    await markAllNotifsRead();
    setMarkingNotifs(false);
    setFeedback('Todas as notificações foram marcadas como lidas!');
  };

  const isTwoColNav = width >= 640;

  return (
    <PizzariaTopShell
      activeTab="perfil"
      subtitle="Conta, Personalização da Dock & Notificações"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrap}>
          {feedback !== '' ? (
            <FeedbackBanner
              type="success"
              message={feedback}
              onDismiss={() => setFeedback('')}
            />
          ) : null}

          {erro !== '' ? (
            <FeedbackBanner
              type="error"
              message={erro}
              onDismiss={() => setErro('')}
            />
          ) : null}

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
                  <Text
                    style={[
                      styles.stepChipText,
                      authMode === 'login' && styles.stepChipTextActive,
                    ]}
                  >
                    Entrar (POST /auth/login)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.stepChip,
                    authMode === 'register' && styles.stepChipActive,
                  ]}
                  onPress={() => {
                    setAuthMode('register');
                    setErro('');
                  }}
                >
                  <Text
                    style={[
                      styles.stepChipText,
                      authMode === 'register' && styles.stepChipTextActive,
                    ]}
                  >
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
              <View
                style={[
                  styles.rowGap,
                  { justifyContent: 'space-between', marginBottom: 10 },
                ]}
              >
                <View style={[styles.rowGap, { flex: 1 }]}>
                  <View style={styles.brandIconBox}>
                    <Feather name="user" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {user.nome}
                    </Text>
                    <Text style={styles.itemDesc} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowGap}>
                  {isVip ? (
                    <View style={localStyles.vipMiniSeal}>
                      <Feather name="star" size={11} color="#FACC15" />
                      <Text style={localStyles.vipMiniSealText}>VIP</Text>
                    </View>
                  ) : null}
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>
                      {user.tipo_usuario ?? 'cliente'}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.rowGap,
                  { justifyContent: 'space-between', marginBottom: 14 },
                ]}
              >
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

          {/* ==========================================================
              NOVA SEÇÃO 1: Estilo de Navegação (Mobile & PC)
             ========================================================== */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: themeAccent }]} />
              <Text style={styles.sectionTitle}>Estilo de Navegação (Mobile & PC)</Text>
            </View>
            <Text style={[styles.sectionMeta, { color: themeAccent }]}>
              {NAV_FRIENDLY_LABELS[navStyle]?.displayTitle}
            </Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={[styles.itemDesc, { marginBottom: 12 }]}>
              Escolha como deseja navegar pelo ecossistema da Pizzaria TOP (fiel à aba
              Interface de /config_cliente). A mudança acontece instantaneamente!
            </Text>

            <View style={isTwoColNav ? localStyles.navModesGrid : undefined}>
              {NAV_MODE_OPTIONS.map((opt) => {
                const selected = navStyle === opt.mode;
                const meta = NAV_FRIENDLY_LABELS[opt.mode];

                return (
                  <TouchableOpacity
                    key={opt.mode}
                    style={[
                      localStyles.navModeCard,
                      isTwoColNav && { width: '48.8%' },
                      selected && {
                        backgroundColor: themeAccentBg,
                        borderColor: themeAccent,
                      },
                    ]}
                    onPress={() => handleSelectNavMode(opt.mode)}
                    activeOpacity={0.82}
                  >
                    <View style={localStyles.navModeCardHeader}>
                      <View
                        style={[
                          localStyles.navModeIconCircle,
                          selected && {
                            backgroundColor: themeAccent,
                            borderColor: themeAccent,
                          },
                        ]}
                      >
                        <Feather
                          name={opt.icon}
                          size={17}
                          color={selected ? '#111827' : themeAccent}
                        />
                      </View>

                      <View
                        style={[
                          localStyles.navModeBadge,
                          selected && {
                            backgroundColor: themeAccent,
                            borderColor: themeAccent,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            localStyles.navModeBadgeText,
                            selected && { color: '#111827' },
                          ]}
                        >
                          {selected ? '✓ ATIVO' : meta.badge}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        localStyles.navModeTitle,
                        selected && { color: themeAccent },
                      ]}
                    >
                      {meta.displayTitle}
                    </Text>
                    <Text style={localStyles.navModeSubtitle}>{opt.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ==========================================================
              NOVA SEÇÃO 2: Notificações (GET /notificacoes)
             ========================================================== */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[styles.sectionDot, { backgroundColor: PIZZARIA_COLORS.cyan }]}
              />
              <Text style={styles.sectionTitle}>Notificações (GET /notificacoes)</Text>
              {unreadNotifs > 0 ? (
                <View style={localStyles.unreadCountBadge}>
                  <Text style={localStyles.unreadCountText}>{unreadNotifs} nova(s)</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.rowGap}>
              {user ? (
                <TouchableOpacity
                  style={localStyles.miniActionBtn}
                  onPress={handleRefreshNotificacoes}
                  disabled={refreshingNotifs}
                  activeOpacity={0.8}
                >
                  {refreshingNotifs ? (
                    <ActivityIndicator size="small" color={PIZZARIA_COLORS.cyan} />
                  ) : (
                    <Feather name="refresh-cw" size={12} color={PIZZARIA_COLORS.cyan} />
                  )}
                </TouchableOpacity>
              ) : null}

              {user && notificacoes.length > 0 ? (
                <TouchableOpacity
                  style={[
                    localStyles.markReadBtn,
                    unreadNotifs === 0 && { opacity: 0.65 },
                  ]}
                  onPress={handleMarkAllRead}
                  disabled={markingNotifs}
                  activeOpacity={0.8}
                >
                  {markingNotifs ? (
                    <ActivityIndicator size="small" color="#FACC15" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={12} color="#FACC15" />
                      <Text style={localStyles.markReadBtnText}>
                        Marcar todas como lidas
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {!user ? (
            <View style={styles.glassCard}>
              <View style={styles.rowGap}>
                <Feather name="bell" size={16} color={PIZZARIA_COLORS.gold} />
                <Text style={[styles.itemDesc, { flex: 1 }]}>
                  Faça login na sua conta para sincronizar avisos de pedidos e promoções
                  em GET /api/notificacoes.
                </Text>
              </View>
            </View>
          ) : notificacoes.length === 0 ? (
            <View style={styles.glassCard}>
              <View style={styles.rowGap}>
                <Feather name="bell-off" size={16} color={PIZZARIA_COLORS.textMuted} />
                <Text style={[styles.itemDesc, { flex: 1 }]}>
                  Nenhuma notificação pendente para esta conta no momento.
                </Text>
              </View>
            </View>
          ) : (
            notificacoes.map((notif, idx) => {
              const nid = notif.id_notificacao ?? notif.id ?? idx + 1;
              const isUnread = !notif.lida || notif.lida === 0;
              const titulo =
                notif.titulo ?? notif.title ?? `Aviso da Pizzaria TOP #${nid}`;
              const mensagem =
                notif.mensagem ??
                notif.message ??
                'Atualização registrada na sua conta Pizzaria TOP.';
              const dataFmt = formatNotifDate(notif.data_criacao ?? notif.created_at);

              return (
                <View
                  key={`notif-${nid}-${idx}`}
                  style={[
                    styles.glassCard,
                    isUnread && localStyles.notifCardUnread,
                  ]}
                >
                  <View style={localStyles.notifHeaderRow}>
                    <View style={[styles.rowGap, { flex: 1 }]}>
                      <View
                        style={[
                          localStyles.notifDot,
                          {
                            backgroundColor: isUnread
                              ? '#FACC15'
                              : 'rgba(255, 255, 255, 0.22)',
                          },
                        ]}
                      />
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {titulo}
                      </Text>
                    </View>
                    {dataFmt ? (
                      <Text style={styles.sectionMeta}>{dataFmt}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.itemDesc, { marginTop: 4 }]}>{mensagem}</Text>
                </View>
              );
            })
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
              <Text style={styles.itemDesc}>
                Faça login para listar seus endereços salvos.
              </Text>
            </View>
          ) : enderecos.length === 0 ? (
            <View style={styles.glassCard}>
              <Text style={styles.itemDesc}>
                Nenhum endereço cadastrado nesta conta.
              </Text>
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
              <Text style={styles.itemDesc}>
                Nenhuma recompensa disponível no momento.
              </Text>
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

const localStyles = StyleSheet.create({
  vipMiniSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  vipMiniSealText: {
    color: '#FEF08A',
    fontSize: 10.5,
    fontWeight: '900',
  },
  navModesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  navModeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 13,
    marginBottom: 10,
  },
  navModeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  navModeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  navModeBadgeText: {
    color: PIZZARIA_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  navModeTitle: {
    color: PIZZARIA_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  navModeSubtitle: {
    color: PIZZARIA_COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
  },
  unreadCountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  miniActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.42)',
  },
  markReadBtnText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '800',
  },
  notifCardUnread: {
    borderColor: 'rgba(250, 204, 21, 0.48)',
    backgroundColor: '#232018',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
