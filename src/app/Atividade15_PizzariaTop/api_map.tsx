import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  ApiEndpointDoc,
  EndpointTestResult,
  HttpMethod,
  PIZZARIATOP_API_BASE_URL,
  PIZZARIATOP_ENDPOINTS,
  testGetEndpoint,
} from '../../services/pizzariatopApi';
import { PizzariaTopShell } from '../../components/pizzariatop/PizzariaTopChrome';
import { PIZZARIA_COLORS, styles } from '../../styles/atividade15_pizzariatop_styles';

const METHOD_COLORS: Record<HttpMethod, { bg: string; fg: string }> = {
  GET: { bg: 'rgba(16, 185, 129, 0.2)', fg: '#6EE7B7' },
  POST: { bg: 'rgba(245, 158, 11, 0.2)', fg: '#FCD34D' },
  PUT: { bg: 'rgba(59, 130, 246, 0.2)', fg: '#93C5FD' },
  PATCH: { bg: 'rgba(139, 92, 246, 0.2)', fg: '#C4B5FD' },
  DELETE: { bg: 'rgba(239, 68, 68, 0.2)', fg: '#FCA5A5' },
};

const CATEGORIES = [
  'Todas',
  'Autenticação',
  'Usuários & Perfil',
  'Endereços & CEP',
  'Cardápio',
  'Carrinho & Cálculo',
  'Pedidos & Entrega',
  'Pagamentos, Cupons & Avaliações',
  'Fidelidade & Notificações',
  'Caixa, Stats, IA & Upload',
  'Diagnóstico',
] as const;

export default function ApiMapScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedMethod, setSelectedMethod] = useState<'TODOS' | HttpMethod>('TODOS');

  const [customPath, setCustomPath] = useState('/sabores');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EndpointTestResult | null>(null);

  const filteredEndpoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PIZZARIATOP_ENDPOINTS.filter((ep) => {
      if (selectedCategory !== 'Todas' && ep.category !== selectedCategory) return false;
      if (selectedMethod !== 'TODOS' && ep.method !== selectedMethod) return false;
      if (!q) return true;
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q)
      );
    });
  }, [search, selectedCategory, selectedMethod]);

  const handleTestGet = async (id: string, path: string) => {
    setTestingId(id);
    const res = await testGetEndpoint(path);
    setLastResult(res);
    setTestingId(null);
  };

  const formatJsonPreview = (data: unknown): string => {
    try {
      const str = JSON.stringify(data, null, 2) ?? 'null';
      return str.length > 3200 ? `${str.slice(0, 3200)}\n... (truncado para exibição)` : str;
    } catch {
      return String(data);
    }
  };

  return (
    <PizzariaTopShell activeTab="api_map" subtitle="Catálogo de Rotas & Testador Axios">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidthWrap}>
          {/* Base URL Banner */}
          <View style={[styles.glassCard, styles.glassCardGold]}>
            <Text style={styles.itemTitle}>Base URL (Axios)</Text>
            <Text style={[styles.couponMetaText, { marginBottom: 10 }]}>
              {PIZZARIATOP_API_BASE_URL}
            </Text>
            <Text style={styles.inputLabel}>Testador Rápido GET</Text>
            <View style={styles.rowGap}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="/sabores ou /cep?cep=76900000"
                placeholderTextColor={PIZZARIA_COLORS.textMuted}
                value={customPath}
                onChangeText={setCustomPath}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.goldCtaBtn}
                onPress={() => handleTestGet('custom', customPath.trim() || '/health')}
                disabled={testingId === 'custom'}
              >
                {testingId === 'custom' ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <>
                    <Feather name="play" size={14} color="#111827" />
                    <Text style={styles.goldCtaText}>Testar GET (Axios)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Resultado do último teste */}
          {lastResult && (
            <View style={styles.glassCard}>
              <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 6 }]}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  GET {lastResult.path}
                </Text>
                <View style={styles.rowGap}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: lastResult.ok
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: lastResult.ok ? '#6EE7B7' : '#FCA5A5' },
                      ]}
                    >
                      HTTP {lastResult.status || 'ERR'}
                    </Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{lastResult.durationMs} ms</Text>
                  </View>
                </View>
              </View>
              {lastResult.errorMessage && (
                <Text style={[styles.errorText, { textAlign: 'left', marginBottom: 4 }]}>
                  {lastResult.errorMessage}
                </Text>
              )}
              <View style={styles.jsonBox}>
                <Text style={styles.jsonText}>{formatJsonPreview(lastResult.data)}</Text>
              </View>
            </View>
          )}

          {/* Busca e filtros */}
          <TextInput
            style={styles.input}
            placeholder="Filtrar rota, descrição ou categoria (ex: /pedidos, cupom, cep)..."
            placeholderTextColor={PIZZARIA_COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, { marginBottom: 8 }]}
          >
            {(['TODOS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => {
              const active = selectedMethod === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.tagPill,
                    active && {
                      backgroundColor: PIZZARIA_COLORS.fireOrange,
                      borderColor: PIZZARIA_COLORS.fireOrange,
                    },
                  ]}
                  onPress={() => setSelectedMethod(m)}
                >
                  <Text style={[styles.tagPillText, active && { color: '#FFFFFF' }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, { marginBottom: 14 }]}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.tagPill,
                    active && {
                      backgroundColor: 'rgba(250, 204, 21, 0.2)',
                      borderColor: PIZZARIA_COLORS.gold,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      active && { color: PIZZARIA_COLORS.gold },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Endpoints Mapeados</Text>
            </View>
            <Text style={styles.sectionMeta}>{filteredEndpoints.length} rota(s)</Text>
          </View>

          {filteredEndpoints.map((ep: ApiEndpointDoc) => {
            const mColor = METHOD_COLORS[ep.method];
            const testTarget = ep.sampleGetPath ?? ep.path;
            const isTesting = testingId === ep.id;
            return (
              <View key={ep.id} style={styles.glassCard}>
                <View style={[styles.rowGap, { justifyContent: 'space-between', marginBottom: 6 }]}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <View style={[styles.methodBadge, { backgroundColor: mColor.bg }]}>
                      <Text style={[styles.methodText, { color: mColor.fg }]}>{ep.method}</Text>
                    </View>
                    <Text style={[styles.itemTitle, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>
                      {ep.path}
                    </Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{ep.auth}</Text>
                  </View>
                </View>

                <Text style={[styles.itemDesc, { marginBottom: 10 }]}>{ep.summary}</Text>

                <View style={[styles.rowGap, { justifyContent: 'space-between' }]}>
                  <Text style={styles.sectionMeta}>{ep.category}</Text>
                  {ep.method === 'GET' && (
                    <TouchableOpacity
                      style={[styles.primaryCtaBtn, { paddingHorizontal: 12, paddingVertical: 7 }]}
                      onPress={() => handleTestGet(ep.id, testTarget)}
                      disabled={isTesting}
                      activeOpacity={0.8}
                    >
                      {isTesting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="play" size={12} color="#FFFFFF" />
                          <Text style={[styles.primaryCtaText, { fontSize: 12 }]}>
                            Testar GET (Axios)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </PizzariaTopShell>
  );
}
