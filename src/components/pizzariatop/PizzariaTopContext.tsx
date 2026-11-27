import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  NotificacaoItem,
  Usuario,
  getFidelidade,
  getMe,
  getNotificacoes,
  logout as apiLogout,
  markNotificacoesRead,
  setAuthToken,
} from '../../services/pizzariatopApi';

export type NavStyleMode = 'dock' | 'classic' | 'sidebar' | 'floating';

export interface CartItem {
  uid: string;
  id_produto: number;
  tipo_item: string;
  nome: string;
  detalhes: string;
  quantidade: number;
  preco_unitario: number;
}

export interface ReservaItem {
  id: string;
  mesa: number;
  lugares: number;
  ambiente: string;
  data: string;
  horario: string;
  cliente: string;
  ocasiao?: string;
  criadaEm: string;
}

export interface MesaLayoutInfo {
  mesa: number;
  lugares: number;
  ambiente: 'Salão Forno a Lenha' | 'Varanda Gourmet' | 'Área VIP Climatizada';
  ocupadaPadrao: boolean;
}

// Grid oficial de 12 mesas (mesas 1, 4, 7 e 10 com 6 lugares; demais com 4 lugares; ~30% ocupadas)
export const MESAS_DISPONIVEIS_LAYOUT: MesaLayoutInfo[] = [
  { mesa: 1, lugares: 6, ambiente: 'Salão Forno a Lenha', ocupadaPadrao: false },
  { mesa: 2, lugares: 4, ambiente: 'Salão Forno a Lenha', ocupadaPadrao: true },
  { mesa: 3, lugares: 4, ambiente: 'Salão Forno a Lenha', ocupadaPadrao: false },
  { mesa: 4, lugares: 6, ambiente: 'Varanda Gourmet', ocupadaPadrao: false },
  { mesa: 5, lugares: 4, ambiente: 'Varanda Gourmet', ocupadaPadrao: true },
  { mesa: 6, lugares: 4, ambiente: 'Varanda Gourmet', ocupadaPadrao: false },
  { mesa: 7, lugares: 6, ambiente: 'Salão Forno a Lenha', ocupadaPadrao: false },
  { mesa: 8, lugares: 4, ambiente: 'Salão Forno a Lenha', ocupadaPadrao: false },
  { mesa: 9, lugares: 4, ambiente: 'Área VIP Climatizada', ocupadaPadrao: true },
  { mesa: 10, lugares: 6, ambiente: 'Área VIP Climatizada', ocupadaPadrao: false },
  { mesa: 11, lugares: 4, ambiente: 'Área VIP Climatizada', ocupadaPadrao: true },
  { mesa: 12, lugares: 4, ambiente: 'Varanda Gourmet', ocupadaPadrao: false },
];

const NAV_STORAGE_KEY = 'pizzaria_nav_style';

function readInitialNavStyle(): NavStyleMode {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(NAV_STORAGE_KEY);
      if (saved === 'dock' || saved === 'classic' || saved === 'sidebar' || saved === 'floating') {
        return saved;
      }
    } catch {
      // Ignora bloqueios de storage no navegador
    }
  }
  return 'dock';
}

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const INITIAL_RESERVAS: ReservaItem[] = [
  {
    id: 'res-demo-1',
    mesa: 4,
    lugares: 6,
    ambiente: 'Varanda Gourmet',
    data: getTodayFormatted(),
    horario: '20:00',
    cliente: 'Cliente Pizzaria TOP',
    ocasiao: 'Jantar em Família',
    criadaEm: new Date().toISOString(),
  },
];

interface PizzariaTopContextValue {
  user: Usuario | null;
  token: string | null;
  topCoins: number;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  navStyle: NavStyleMode;
  setNavStyle: (mode: NavStyleMode) => void;
  isVip: boolean;
  setIsVip: (v: boolean) => void;
  reservas: ReservaItem[];
  mesasOcupadas: number[];
  addReserva: (item: Omit<ReservaItem, 'id' | 'criadaEm'>) => ReservaItem;
  cancelReserva: (id: string) => void;
  notificacoes: NotificacaoItem[];
  unreadNotifs: number;
  refreshNotifs: () => Promise<void>;
  markAllNotifsRead: () => Promise<void>;
  smartWaiterVisible: boolean;
  openSmartWaiter: () => void;
  closeSmartWaiter: () => void;
  setSession: (user: Usuario, token?: string | null) => void;
  setTopCoins: (coins: number) => void;
  refreshSession: () => Promise<Usuario | null>;
  logoutSession: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'uid'>) => void;
  updateCartQty: (uid: string, delta: number) => void;
  removeFromCart: (uid: string) => void;
  clearCart: () => void;
}

const PizzariaTopContext = createContext<PizzariaTopContextValue | undefined>(undefined);

export function PizzariaTopProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [topCoins, setTopCoins] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [navStyle, setNavStyleState] = useState<NavStyleMode>(() => readInitialNavStyle());
  const [vipSubscribed, setVipSubscribed] = useState<boolean>(false);
  const [reservas, setReservas] = useState<ReservaItem[]>(INITIAL_RESERVAS);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [smartWaiterVisible, setSmartWaiterVisible] = useState<boolean>(false);

  const setNavStyle = useCallback((mode: NavStyleMode) => {
    setNavStyleState(mode);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(NAV_STORAGE_KEY, mode);
      } catch {
        // Ignora erro de escrita no storage
      }
    }
  }, []);

  const isVip = vipSubscribed || topCoins >= 150;

  const setIsVip = useCallback((v: boolean) => {
    setVipSubscribed(v);
  }, []);

  const refreshNotifs = useCallback(async () => {
    try {
      const list = await getNotificacoes();
      setNotificacoes(list);
      const unread = list.filter((n) => !n.lida || n.lida === 0).length;
      setUnreadNotifs(unread);
    } catch {
      // Sem sessão ativa ou endpoint silencioso
      setUnreadNotifs(0);
    }
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    try {
      await markNotificacoesRead();
    } catch {
      // Mantém atualização otimista local
    } finally {
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadNotifs(0);
    }
  }, []);

  const setSession = useCallback((nextUser: Usuario, nextToken?: string | null) => {
    setUser(nextUser);
    if (nextToken !== undefined) {
      setToken(nextToken);
      setAuthToken(nextToken);
    }
    if (typeof nextUser.pontos_fidelidade === 'number') {
      setTopCoins(nextUser.pontos_fidelidade);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const meRes = await getMe();
      const loadedUser = meRes.user ?? meRes.data ?? null;
      if (loadedUser) {
        setUser(loadedUser);
        if (typeof loadedUser.pontos_fidelidade === 'number') {
          setTopCoins(loadedUser.pontos_fidelidade);
        } else {
          try {
            const fid = await getFidelidade();
            const pts = fid?.pontos ?? fid?.pontos_fidelidade ?? fid?.data?.pontos_fidelidade;
            if (typeof pts === 'number') setTopCoins(pts);
          } catch {
            // Endpoint opcional se backend não tiver pontos carregados
          }
        }
        await refreshNotifs();
        return loadedUser;
      }
      return null;
    } catch {
      return null;
    }
  }, [refreshNotifs]);

  useEffect(() => {
    if (user) {
      refreshNotifs();
    }
  }, [user, refreshNotifs]);

  const logoutSession = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Limpa estado local mesmo se servidor retornar erro
    } finally {
      setUser(null);
      setToken(null);
      setAuthToken(null);
      setTopCoins(0);
      setVipSubscribed(false);
      setNotificacoes([]);
      setUnreadNotifs(0);
    }
  }, []);

  const addReserva = useCallback((item: Omit<ReservaItem, 'id' | 'criadaEm'>): ReservaItem => {
    const created: ReservaItem = {
      ...item,
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      criadaEm: new Date().toISOString(),
    };
    setReservas((prev) => [created, ...prev]);
    return created;
  }, []);

  const cancelReserva = useCallback((id: string) => {
    setReservas((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const mesasOcupadas = useMemo(() => {
    const occupied = new Set<number>(
      MESAS_DISPONIVEIS_LAYOUT.filter((m) => m.ocupadaPadrao).map((m) => m.mesa)
    );
    reservas.forEach((r) => occupied.add(r.mesa));
    return Array.from(occupied);
  }, [reservas]);

  const openSmartWaiter = useCallback(() => setSmartWaiterVisible(true), []);
  const closeSmartWaiter = useCallback(() => setSmartWaiterVisible(false), []);

  const addToCart = useCallback((item: Omit<CartItem, 'uid'>) => {
    const uid = `${item.tipo_item}-${item.id_produto}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCart((prev) => [...prev, { ...item, uid }]);
  }, []);

  const updateCartQty = useCallback((uid: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.uid === uid ? { ...c, quantidade: c.quantidade + delta } : c))
        .filter((c) => c.quantidade > 0)
    );
  }, []);

  const removeFromCart = useCallback((uid: string) => {
    setCart((prev) => prev.filter((c) => c.uid !== uid));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantidade, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0),
    [cart]
  );

  const value = useMemo<PizzariaTopContextValue>(
    () => ({
      user,
      token,
      topCoins,
      cart,
      cartCount,
      cartSubtotal,
      navStyle,
      setNavStyle,
      isVip,
      setIsVip,
      reservas,
      mesasOcupadas,
      addReserva,
      cancelReserva,
      notificacoes,
      unreadNotifs,
      refreshNotifs,
      markAllNotifsRead,
      smartWaiterVisible,
      openSmartWaiter,
      closeSmartWaiter,
      setSession,
      setTopCoins,
      refreshSession,
      logoutSession,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
    }),
    [
      user,
      token,
      topCoins,
      cart,
      cartCount,
      cartSubtotal,
      navStyle,
      setNavStyle,
      isVip,
      setIsVip,
      reservas,
      mesasOcupadas,
      addReserva,
      cancelReserva,
      notificacoes,
      unreadNotifs,
      refreshNotifs,
      markAllNotifsRead,
      smartWaiterVisible,
      openSmartWaiter,
      closeSmartWaiter,
      setSession,
      refreshSession,
      logoutSession,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
    ]
  );

  return (
    <PizzariaTopContext.Provider value={value}>
      {children}
    </PizzariaTopContext.Provider>
  );
}

export function usePizzariaTop() {
  const ctx = useContext(PizzariaTopContext);
  if (!ctx) {
    throw new Error('usePizzariaTop deve ser usado dentro de PizzariaTopProvider');
  }
  return ctx;
}
