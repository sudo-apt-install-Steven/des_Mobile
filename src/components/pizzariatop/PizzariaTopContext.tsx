import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Usuario,
  getMe,
  logout as apiLogout,
  setAuthToken,
  getFidelidade,
} from '../../services/pizzariatopApi';

export interface CartItem {
  uid: string;
  id_produto: number;
  tipo_item: string;
  nome: string;
  detalhes: string;
  quantidade: number;
  preco_unitario: number;
}

interface PizzariaTopContextValue {
  user: Usuario | null;
  token: string | null;
  topCoins: number;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
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
        return loadedUser;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

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
    }
  }, []);

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
