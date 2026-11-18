import axios, { AxiosError, AxiosInstance } from 'axios';

export const PIZZARIATOP_API_BASE_URL = 'https://apipizzariatop.dev.vilhena.ifro.edu.br/api';
export const PIZZARIATOP_ORIGIN_URL = 'https://apipizzariatop.dev.vilhena.ifro.edu.br';

let inMemoryAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryAuthToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAuthToken;
}

export const pizzariatopApi: AxiosInstance = axios.create({
  baseURL: PIZZARIATOP_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

pizzariatopApi.interceptors.request.use((config) => {
  if (inMemoryAuthToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${inMemoryAuthToken}`;
  }
  return config;
});

// ========================
// Tipos TypeScript
// ========================

export interface Usuario {
  id?: number;
  id_usuario?: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  tipo_usuario?: 'cliente' | 'funcionario' | 'admin' | 'gerente' | 'suporte' | string;
  pontos_fidelidade?: number;
  codigo_afiliado?: string;
  profile_picture_url?: string | null;
}

export interface LoginPayload {
  email: string;
  senha: string;
  device_id?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  require_password_change?: boolean;
  data?: {
    user: Usuario;
    token?: string;
  };
  user?: Usuario;
  token?: string;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface Tamanho {
  id?: number;
  id_tamanho?: number;
  nome_tamanho: string;
  numero_fatias: number;
  numero_sabores: number;
  preco_base: number | string;
  diametro_cm?: number;
  imagem_url?: string | null;
  descricao?: string | null;
  ativo?: number | boolean;
}

export interface Sabor {
  id?: number;
  id_sabor?: number;
  nome_sabor: string;
  descricao?: string | null;
  categoria_sabor?: string | null;
  preco_adicional?: number | string;
  imagem_url?: string | null;
  disponivel?: number | boolean;
}

export interface Massa {
  id?: number;
  id_massa?: number;
  nome_massa: string;
  descricao?: string | null;
  preco_adicional?: number | string;
  disponivel?: number | boolean;
}

export interface Borda {
  id?: number;
  id_borda?: number;
  nome_borda: string;
  descricao?: string | null;
  preco_adicional?: number | string;
  disponivel?: number | boolean;
}

export interface Produto {
  id?: number;
  id_produto?: number;
  nome_produto: string;
  descricao?: string | null;
  preco_base: number | string;
  imagem_url?: string | null;
  disponivel?: number | boolean;
  id_categoria?: number;
}

export interface Combo {
  id?: number;
  id_combo?: number;
  nome?: string;
  nome_combo?: string;
  descricao?: string | null;
  preco?: number | string;
  preco_combo?: number | string;
  imagem_url?: string | null;
  ativo?: number | boolean;
}

export interface Cupom {
  id?: number;
  id_cupom?: number;
  codigo: string;
  tipo_desconto: 'percentual' | 'fixo' | string;
  valor_desconto: number | string;
  data_validade?: string | null;
  ativo?: number | boolean;
  descricao?: string | null;
}

export interface Avaliacao {
  id?: number;
  id_pedido?: number;
  nome?: string;
  nome_cliente?: string;
  avaliacao: number;
  comentario?: string | null;
  comentario_avaliacao?: string | null;
  likes_avaliacao?: number;
  foto?: string | null;
  foto_avaliacao?: string | null;
  foto_cliente?: string | null;
  data_pedido?: string;
}

export interface Endereco {
  id?: number;
  id_endereco?: number;
  logradouro?: string;
  rua?: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado?: string;
  cep?: string;
}

export interface CepResult {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  cidade?: string;
  uf?: string;
  estado?: string;
  erro?: boolean;
}

export interface Recompensa {
  id?: number;
  id_recompensa?: number;
  nome?: string;
  titulo?: string;
  descricao?: string | null;
  pontos_necessarios?: number;
  custo_pontos?: number;
  ativo?: number | boolean;
}

export interface PedidoItemPayload {
  tipo_item?: string;
  id_produto: number;
  quantidade: number;
  preco_unitario: number;
}

export interface CreatePedidoPayload {
  id_usuario: number;
  id_endereco: number;
  total?: number;
  valor_total: number;
  valor_subtotal?: number;
  forma_pagamento?: string;
  observacoes?: string;
  itens?: PedidoItemPayload[];
}

export interface Pedido {
  id?: number;
  id_pedido?: number;
  id_usuario?: number;
  id_endereco?: number;
  valor_total: number | string;
  valor_subtotal?: number | string;
  forma_pagamento?: string;
  status_pedido: string;
  observacoes?: string | null;
  data_pedido?: string;
  nome_cliente?: string;
  logradouro?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
}

export interface TrackingResponse {
  id_pedido?: number;
  status_pedido?: string;
  latitude?: number;
  longitude?: number;
  endereco?: Endereco | string;
  previsao_entrega?: string;
  [key: string]: unknown;
}

export interface CalculatePayload {
  type: 'pizza' | 'order';
  tamanho?: string;
  sabores?: number | string[];
  borda?: string | boolean;
  massa?: string;
  itens?: Array<{ preco: number; quantidade: number }>;
}

export interface CalculateResponse {
  success?: boolean;
  total?: number;
  subtotal?: number;
  taxa_entrega?: number;
  preco_base?: number;
  adicional_borda?: number;
  adicional_sabores?: number;
  data?: {
    total?: number;
    subtotal?: number;
    [key: string]: unknown;
  };
}

export interface EndpointTestResult {
  path: string;
  status: number;
  ok: boolean;
  durationMs: number;
  data: unknown;
  errorMessage?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpointDoc {
  id: string;
  method: HttpMethod;
  path: string;
  category:
    | 'Autenticação'
    | 'Usuários & Perfil'
    | 'Endereços & CEP'
    | 'Cardápio'
    | 'Carrinho & Cálculo'
    | 'Pedidos & Entrega'
    | 'Pagamentos, Cupons & Avaliações'
    | 'Fidelidade & Notificações'
    | 'Caixa, Stats, IA & Upload'
    | 'Diagnóstico';
  auth: 'Pública' | 'Sessão/Bearer' | 'Admin/Staff';
  summary: string;
  sampleGetPath?: string;
}

// ========================
// Utilitários
// ========================

export function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const candidate =
      obj.data ??
      obj.value ??
      obj.items ??
      obj.results ??
      obj.sabores ??
      obj.produtos ??
      obj.tamanhos ??
      obj.massas ??
      obj.bordas ??
      obj.combos ??
      obj.cupons ??
      obj.avaliacoes ??
      obj.pedidos ??
      obj.enderecos ??
      obj.recompensas;
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

export function extractErrorMessage(err: unknown, fallback = 'Erro ao comunicar com a API PizzariaTop.'): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
    const serverMsg = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
    if (serverMsg) return serverMsg;
    if (axiosErr.response?.status) {
      return `${fallback} (HTTP ${axiosErr.response.status})`;
    }
    if (axiosErr.message) return axiosErr.message;
  } else if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${PIZZARIATOP_ORIGIN_URL}${normalized}`;
}

export function formatCurrency(value: number | string | undefined | null): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

// ========================
// Autenticação & Perfil
// ========================

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await pizzariatopApi.post<LoginResponse>('/auth/login', payload, {
    headers: payload.device_id ? { 'x-device-fingerprint': payload.device_id } : undefined,
  });
  const token = res.data?.data?.token ?? res.data?.token ?? null;
  if (token) {
    setAuthToken(token);
  }
  return res.data;
}

export async function registerUser(payload: CreateUserPayload) {
  const res = await pizzariatopApi.post('/create-user', payload);
  return res.data;
}

export async function getMe() {
  const res = await pizzariatopApi.get<{ success: boolean; user?: Usuario; data?: Usuario }>('/auth/me');
  return res.data;
}

export async function logout() {
  try {
    const res = await pizzariatopApi.post('/auth/me');
    return res.data;
  } finally {
    setAuthToken(null);
  }
}

export async function getFidelidade() {
  const res = await pizzariatopApi.get('/fidelidade');
  return res.data;
}

// ========================
// Cardápio & Vitrine
// ========================

export async function getTamanhos(all = false): Promise<Tamanho[]> {
  const res = await pizzariatopApi.get('/tamanhos', { params: all ? { all: 'true' } : undefined });
  return extractList<Tamanho>(res.data);
}

export async function getSabores(disponivelOnly = false): Promise<Sabor[]> {
  const res = await pizzariatopApi.get('/sabores', {
    params: disponivelOnly ? { disponivel: 'true' } : undefined,
  });
  return extractList<Sabor>(res.data);
}

export async function getMassas(): Promise<Massa[]> {
  const res = await pizzariatopApi.get('/massas');
  return extractList<Massa>(res.data);
}

export async function getBordas(): Promise<Borda[]> {
  const res = await pizzariatopApi.get('/bordas');
  return extractList<Borda>(res.data);
}

export async function getProdutos(showcase = false): Promise<Produto[]> {
  const res = await pizzariatopApi.get('/produtos', {
    params: showcase ? { showcase: 'true' } : undefined,
  });
  return extractList<Produto>(res.data);
}

export async function getCombos(): Promise<Combo[]> {
  const res = await pizzariatopApi.get('/combos');
  return extractList<Combo>(res.data);
}

export async function getCupons(): Promise<Cupom[]> {
  const res = await pizzariatopApi.get('/cupons');
  return extractList<Cupom>(res.data);
}

export async function getAvaliacoesTop(): Promise<Avaliacao[]> {
  const res = await pizzariatopApi.get('/avaliacoes/top');
  return extractList<Avaliacao>(res.data);
}

export async function getAvaliacoes(limit = 20): Promise<Avaliacao[]> {
  const res = await pizzariatopApi.get('/avaliacoes', { params: { limit } });
  return extractList<Avaliacao>(res.data);
}

export async function likeAvaliacao(idPedido: number) {
  const res = await pizzariatopApi.post(`/avaliacoes/${idPedido}/like`);
  return res.data;
}

// ========================
// Cálculo, Endereços, CEP, Pedidos & Fidelidade
// ========================

export async function calculatePrice(payload: CalculatePayload): Promise<CalculateResponse> {
  const res = await pizzariatopApi.post<CalculateResponse>('/calculate', payload);
  return res.data;
}

export async function validateCupom(codigo: string, idUsuario?: number) {
  const res = await pizzariatopApi.post('/cupons/validate', {
    codigo,
    ...(idUsuario ? { id_usuario: idUsuario } : {}),
  });
  return res.data;
}

export async function buscarCep(cep: string): Promise<CepResult> {
  const cleanCep = cep.replace(/\D/g, '');
  const res = await pizzariatopApi.get<CepResult & { data?: CepResult }>('/cep', {
    params: { cep: cleanCep },
  });
  return res.data?.data ?? res.data;
}

export async function getTempoEntrega(): Promise<{ tempo_estimado?: number; tempo?: number; [key: string]: unknown }> {
  const res = await pizzariatopApi.get('/tempo_entrega');
  return res.data;
}

export async function getEnderecos(): Promise<Endereco[]> {
  const res = await pizzariatopApi.get('/enderecos');
  return extractList<Endereco>(res.data);
}

export async function createEndereco(payload: Omit<Endereco, 'id' | 'id_endereco'>) {
  const res = await pizzariatopApi.post('/enderecos', payload);
  return res.data;
}

export async function getPedidos(idUsuario?: number): Promise<Pedido[]> {
  const res = await pizzariatopApi.get('/pedidos', {
    params: idUsuario ? { id_usuario: idUsuario } : undefined,
  });
  return extractList<Pedido>(res.data);
}

export async function createPedido(payload: CreatePedidoPayload) {
  const res = await pizzariatopApi.post('/pedidos', payload);
  return res.data;
}

export async function getTracking(pedidoId: number | string): Promise<TrackingResponse> {
  const res = await pizzariatopApi.get(`/tracking/${pedidoId}`);
  return res.data?.data ?? res.data;
}

export async function getRecompensas(): Promise<Recompensa[]> {
  const res = await pizzariatopApi.get('/recompensas');
  return extractList<Recompensa>(res.data);
}

export async function resgatarRecompensa(idRecompensa: number) {
  const res = await pizzariatopApi.post('/resgates', { id_recompensa: idRecompensa });
  return res.data;
}

// ========================
// Testador Genérico GET (Axios)
// ========================

export async function testGetEndpoint(path: string): Promise<EndpointTestResult> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const start = Date.now();
  try {
    const resposta = await pizzariatopApi.get(normalized);
    const durationMs = Date.now() - start;
    console.log(`[Axios GET ${normalized}]`, resposta.data);
    return {
      path: normalized,
      status: resposta.status,
      ok: true,
      durationMs,
      data: resposta.data,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    if (axios.isAxiosError(err)) {
      console.log(`[Axios GET ${normalized} ERROR]`, err.response?.data ?? err.message);
      return {
        path: normalized,
        status: err.response?.status ?? 0,
        ok: false,
        durationMs,
        data: err.response?.data ?? null,
        errorMessage: extractErrorMessage(err),
      };
    }
    return {
      path: normalized,
      status: 0,
      ok: false,
      durationMs,
      data: null,
      errorMessage: extractErrorMessage(err),
    };
  }
}

// ========================
// Catálogo Completo de Rotas da API PizzariaTop
// ========================

export const PIZZARIATOP_ENDPOINTS: ApiEndpointDoc[] = [
  // Autenticação
  { id: 'auth-login', method: 'POST', path: '/auth/login', category: 'Autenticação', auth: 'Pública', summary: 'Autentica usuário ({ email, senha, device_id? }), grava sessão e retorna user/token.' },
  { id: 'auth-me-get', method: 'GET', path: '/auth/me', category: 'Autenticação', auth: 'Sessão/Bearer', summary: 'Retorna dados do usuário autenticado.' },
  { id: 'auth-me-post', method: 'POST', path: '/auth/me', category: 'Autenticação', auth: 'Sessão/Bearer', summary: 'Encerra a sessão atual (logout).' },
  { id: 'create-user', method: 'POST', path: '/create-user', category: 'Autenticação', auth: 'Pública', summary: 'Cadastro rápido de cliente ({ nome, email, senha }).' },

  // Usuários & Perfil
  { id: 'usuarios-list', method: 'GET', path: '/usuarios', category: 'Usuários & Perfil', auth: 'Pública', summary: 'Lista usuários (opcional ?tipo=cliente|funcionario).' },
  { id: 'usuarios-create', method: 'POST', path: '/usuarios', category: 'Usuários & Perfil', auth: 'Pública', summary: 'Cria usuário com senha forte e código de indicação opcional.' },
  { id: 'usuarios-id', method: 'GET', path: '/usuarios/[id]', category: 'Usuários & Perfil', auth: 'Pública', summary: 'Consulta, atualiza (PUT/PATCH) ou remove (DELETE) usuário por ID.', sampleGetPath: '/usuarios/1' },
  { id: 'usuarios-me-config', method: 'PATCH', path: '/usuarios/me/config', category: 'Usuários & Perfil', auth: 'Sessão/Bearer', summary: 'Atualiza preferência mostrar_infos_avaliacao.' },
  { id: 'users-profile', method: 'GET', path: '/users/profile', category: 'Usuários & Perfil', auth: 'Sessão/Bearer', summary: 'Lê (GET) ou atualiza (PUT) perfil e pagamento padrão.' },
  { id: 'users-avatar', method: 'POST', path: '/users/avatar', category: 'Usuários & Perfil', auth: 'Sessão/Bearer', summary: 'Upload (POST), consulta (GET) ou remoção (DELETE) do avatar.' },

  // Endereços & CEP
  { id: 'enderecos-list', method: 'GET', path: '/enderecos', category: 'Endereços & CEP', auth: 'Sessão/Bearer', summary: 'Lista endereços do usuário logado.' },
  { id: 'enderecos-create', method: 'POST', path: '/enderecos', category: 'Endereços & CEP', auth: 'Sessão/Bearer', summary: 'Cadastra endereço de entrega.' },
  { id: 'enderecos-id', method: 'GET', path: '/enderecos/[id]', category: 'Endereços & CEP', auth: 'Pública', summary: 'Consulta/atualiza/remove endereço por ID.', sampleGetPath: '/enderecos/1' },
  { id: 'cep-lookup', method: 'GET', path: '/cep?cep=76900000', category: 'Endereços & CEP', auth: 'Pública', summary: 'Consulta endereço via ViaCEP (com fallback 76900-000).', sampleGetPath: '/cep?cep=76900000' },

  // Cardápio
  { id: 'categorias', method: 'GET', path: '/categorias', category: 'Cardápio', auth: 'Pública', summary: 'Lista categorias de produtos ordenadas.' },
  { id: 'produtos', method: 'GET', path: '/produtos', category: 'Cardápio', auth: 'Pública', summary: 'Lista produtos do cardápio (suporta ?showcase=true).' },
  { id: 'produtos-id', method: 'GET', path: '/produtos/[id]', category: 'Cardápio', auth: 'Pública', summary: 'Consulta/edita/remove produto por ID.', sampleGetPath: '/produtos/1' },
  { id: 'sabores', method: 'GET', path: '/sabores', category: 'Cardápio', auth: 'Pública', summary: 'Lista sabores de pizza.' },
  { id: 'sabores-id', method: 'GET', path: '/sabores/[id]', category: 'Cardápio', auth: 'Pública', summary: 'Consulta/edita/remove sabor por ID.', sampleGetPath: '/sabores/1' },
  { id: 'tamanhos', method: 'GET', path: '/tamanhos', category: 'Cardápio', auth: 'Pública', summary: 'Lista tamanhos ativos (ou ?all=true).' },
  { id: 'massas', method: 'GET', path: '/massas', category: 'Cardápio', auth: 'Pública', summary: 'Lista tipos de massa disponíveis.' },
  { id: 'bordas', method: 'GET', path: '/bordas', category: 'Cardápio', auth: 'Pública', summary: 'Lista opções de borda recheada.' },
  { id: 'ingredientes', method: 'GET', path: '/ingredientes', category: 'Cardápio', auth: 'Pública', summary: 'Lista ingredientes cadastrados.' },
  { id: 'combos', method: 'GET', path: '/combos', category: 'Cardápio', auth: 'Pública', summary: 'Lista combos promocionais ativos.' },
  { id: 'search', method: 'GET', path: '/search?q=calabresa', category: 'Cardápio', auth: 'Pública', summary: 'Busca rápida no cardápio (mock).', sampleGetPath: '/search?q=calabresa' },

  // Carrinho & Cálculo
  { id: 'carrinho-get', method: 'GET', path: '/carrinho', category: 'Carrinho & Cálculo', auth: 'Pública', summary: 'Lista itens do carrinho por sessão ou session_id.' },
  { id: 'carrinho-post', method: 'POST', path: '/carrinho', category: 'Carrinho & Cálculo', auth: 'Pública', summary: 'Adiciona item ao carrinho.' },
  { id: 'carrinho-del', method: 'DELETE', path: '/carrinho', category: 'Carrinho & Cálculo', auth: 'Pública', summary: 'Remove item ou limpa carrinho.' },
  { id: 'calculate', method: 'POST', path: '/calculate', category: 'Carrinho & Cálculo', auth: 'Pública', summary: 'Calcula preço da pizza ou pedido stateless.' },

  // Pedidos & Entrega
  { id: 'pedidos-get', method: 'GET', path: '/pedidos', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Lista últimos 50 pedidos (aceita ?id_usuario=).' },
  { id: 'pedidos-post', method: 'POST', path: '/pedidos', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Cria novo pedido com itens.' },
  { id: 'pedidos-id', method: 'GET', path: '/pedidos/[id]', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Consulta/atualiza status do pedido (PUT/PATCH) ou remove.', sampleGetPath: '/pedidos/1' },
  { id: 'pedidos-fav', method: 'GET', path: '/pedidos/favoritos', category: 'Pedidos & Entrega', auth: 'Sessão/Bearer', summary: 'Lista itens favoritos do cliente.' },
  { id: 'entrega-list', method: 'GET', path: '/entrega', category: 'Pedidos & Entrega', auth: 'Sessão/Bearer', summary: 'Lista pedidos em preparo ou saiu para entrega.' },
  { id: 'entrega-loc', method: 'POST', path: '/entrega/atualizar-localizacao', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Atualiza coordenadas do entregador em memória.' },
  { id: 'tracking-id', method: 'GET', path: '/tracking/[pedidoId]', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Rastreamento de status e localização do pedido.', sampleGetPath: '/tracking/1' },
  { id: 'tempo-entrega', method: 'GET', path: '/tempo_entrega', category: 'Pedidos & Entrega', auth: 'Pública', summary: 'Calcula tempo estimado de entrega com base na fila.' },

  // Pagamentos, Cupons & Avaliações
  { id: 'pagamentos', method: 'POST', path: '/pagamentos', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Simula pagamento (PIX/Cartão) e confirma pedido.' },
  { id: 'cupons-get', method: 'GET', path: '/cupons', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Lista cupons promocionais cadastrados.' },
  { id: 'cupons-validate', method: 'POST', path: '/cupons/validate', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Valida código de cupom e regras de uso.' },
  { id: 'avaliacoes-get', method: 'GET', path: '/avaliacoes', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Lista avaliações de clientes (?limit=20).' },
  { id: 'avaliacoes-top', method: 'GET', path: '/avaliacoes/top', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Top 5 avaliações em destaque.' },
  { id: 'avaliacoes-like', method: 'POST', path: '/avaliacoes/[id]/like', category: 'Pagamentos, Cupons & Avaliações', auth: 'Pública', summary: 'Curtir uma avaliação de pedido.' },

  // Fidelidade & Notificações
  { id: 'fidelidade', method: 'GET', path: '/fidelidade', category: 'Fidelidade & Notificações', auth: 'Sessão/Bearer', summary: 'Saldo de pontos / TopCoins do usuário.' },
  { id: 'recompensas', method: 'GET', path: '/recompensas', category: 'Fidelidade & Notificações', auth: 'Pública', summary: 'Lista recompensas ativas para resgate.' },
  { id: 'resgates', method: 'POST', path: '/resgates', category: 'Fidelidade & Notificações', auth: 'Sessão/Bearer', summary: 'Resgata recompensa (POST) ou lista resgates (GET).' },
  { id: 'notificacoes', method: 'GET', path: '/notificacoes', category: 'Fidelidade & Notificações', auth: 'Sessão/Bearer', summary: 'Lista últimas 20 notificações ou marca lidas (PUT).' },
  { id: 'notify', method: 'GET', path: '/notify', category: 'Fidelidade & Notificações', auth: 'Pública', summary: 'Store de notificações em memória.' },

  // Caixa, Stats, IA & Upload
  { id: 'caixa', method: 'GET', path: '/caixa?atual=1', category: 'Caixa, Stats, IA & Upload', auth: 'Admin/Staff', summary: 'Turno atual, abertura (POST) e fechamento (PATCH) do caixa.' },
  { id: 'config-loja', method: 'GET', path: '/configuracoes/loja', category: 'Caixa, Stats, IA & Upload', auth: 'Pública', summary: 'Horários, banner e taxas de entrega da loja.' },
  { id: 'config-meta', method: 'GET', path: '/configuracoes/meta', category: 'Caixa, Stats, IA & Upload', auth: 'Pública', summary: 'Metas de vendas e contagem de pedidos.' },
  { id: 'stats', method: 'GET', path: '/stats', category: 'Caixa, Stats, IA & Upload', auth: 'Pública', summary: 'Faturamento, pedidos de hoje e top sabores.' },
  { id: 'stats-chart', method: 'GET', path: '/stats/chart', category: 'Caixa, Stats, IA & Upload', auth: 'Admin/Staff', summary: 'Série diária de receita dos últimos 7 dias.' },
  { id: 'ai-chat', method: 'POST', path: '/ai/chat', category: 'Caixa, Stats, IA & Upload', auth: 'Sessão/Bearer', summary: 'Garçom/Assistente IA com contexto do cardápio.' },
  { id: 'upload', method: 'POST', path: '/upload', category: 'Caixa, Stats, IA & Upload', auth: 'Pública', summary: 'Upload de imagem (multipart <= 3MB).' },
  { id: 'webhooks', method: 'GET', path: '/webhooks', category: 'Caixa, Stats, IA & Upload', auth: 'Pública', summary: 'Registro e disparo simulado de webhooks.' },

  // Diagnóstico
  { id: 'health', method: 'GET', path: '/health', category: 'Diagnóstico', auth: 'Pública', summary: 'Healthcheck básico da API.' },
  { id: 'ping', method: 'GET', path: '/ping', category: 'Diagnóstico', auth: 'Pública', summary: 'Resposta rápida ping/pong.' },
  { id: 'status', method: 'GET', path: '/status', category: 'Diagnóstico', auth: 'Pública', summary: 'Status geral da aplicação.' },
  { id: 'version', method: 'GET', path: '/version', category: 'Diagnóstico', auth: 'Pública', summary: 'Versão publicada da API.' },
  { id: 'test-db', method: 'GET', path: '/test-db', category: 'Diagnóstico', auth: 'Pública', summary: 'Testa conectividade com o banco MySQL.' },
  { id: 'diagnostic', method: 'GET', path: '/diagnostic', category: 'Diagnóstico', auth: 'Pública', summary: 'Diagnóstico completo de ambiente e serviços.' },
  { id: 'cors-test', method: 'GET', path: '/cors-test', category: 'Diagnóstico', auth: 'Pública', summary: 'Verifica cabeçalhos CORS retornados pela API.' },
];
