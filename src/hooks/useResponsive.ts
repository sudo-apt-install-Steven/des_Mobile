import { useWindowDimensions, Platform } from 'react-native';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ResponsiveConfig<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}

export interface ShadowOptions {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
}

/**
 * Cria sombras compatíveis com Android, iOS e Web.
 * Na Web, utiliza `boxShadow` para evitar avisos de depreciação do React Native Web ("shadow* props are deprecated").
 * No Native, utiliza as propriedades padrão de sombra e elevation.
 */
export function createShadow({
  color = '#000000',
  offset = { width: 0, height: 2 },
  opacity = 0.1,
  radius = 4,
  elevation = 2,
}: ShadowOptions): any {
  if (Platform.OS === 'web') {
    const x = offset.width ?? 0;
    const y = offset.height ?? 2;
    const r = radius ?? 4;
    // Se a cor for hex ou rgb, converte ou aplica opacidade
    let shadowVal = `${x}px ${y}px ${r}px rgba(0, 0, 0, ${opacity})`;
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      if (hex.length === 6) {
        const num = parseInt(hex, 16);
        const red = (num >> 16) & 255;
        const green = (num >> 8) & 255;
        const blue = num & 255;
        shadowVal = `${x}px ${y}px ${r}px rgba(${red}, ${green}, ${blue}, ${opacity})`;
      } else if (hex.length === 3) {
        const red = parseInt(hex[0] + hex[0], 16);
        const green = parseInt(hex[1] + hex[1], 16);
        const blue = parseInt(hex[2] + hex[2], 16);
        shadowVal = `${x}px ${y}px ${r}px rgba(${red}, ${green}, ${blue}, ${opacity})`;
      }
    } else if (color.startsWith('rgb')) {
      shadowVal = `${x}px ${y}px ${r}px ${color}`;
    }
    return {
      boxShadow: shadowVal,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/**
 * Flag segura de animação cross-platform.
 * Na Web, useNativeDriver não é suportado pelo módulo nativo e gera warnings.
 */
export const useNativeDriver = Platform.OS !== 'web';

/**
 * Hook reativo de Media Queries e Dimensões para React Native e Expo (Mobile & Web).
 * Atualiza automaticamente em caso de rotação de tela, split screen ou redimensionamento do navegador.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPortrait = height >= width;
  const isLandscape = width > height;

  let breakpoint: Breakpoint = 'xs';
  if (width >= 1200) {
    breakpoint = 'xl';
  } else if (width >= 900) {
    breakpoint = 'lg';
  } else if (width >= 600) {
    breakpoint = 'md';
  } else if (width >= 380) {
    breakpoint = 'sm';
  } else {
    breakpoint = 'xs';
  }

  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 600;
  const isSmallDevice = width < 380;

  /**
   * Seleciona valor responsivo baseado no breakpoint atual ou categoria de dispositivo
   */
  const value = <T,>(config: ResponsiveConfig<T>): T => {
    if (config[breakpoint] !== undefined) {
      return config[breakpoint] as T;
    }
    if (isDesktop && config.desktop !== undefined) {
      return config.desktop;
    }
    if (isTablet && config.tablet !== undefined) {
      return config.tablet;
    }
    if (isPhone && config.phone !== undefined) {
      return config.phone;
    }
    return config.default;
  };

  /**
   * Retorna o número ideal de colunas para listas e grids baseadas na tela
   */
  const getColumns = (phoneCols = 1, tabletCols = 2, desktopCols = 3): number => {
    if (isDesktop) return desktopCols;
    if (isTablet) return tabletCols;
    return phoneCols;
  };

  /**
   * Largura máxima sugerida para conter conteúdo centralizado em telas grandes (Tablets/Web)
   */
  const maxContentWidth = Math.min(width, 1024);

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    breakpoint,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    isSmallDevice,
    value,
    getColumns,
    maxContentWidth,
    useNativeDriver,
    createShadow,
  };
}
