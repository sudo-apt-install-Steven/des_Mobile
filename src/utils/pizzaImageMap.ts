import { ImageSourcePropType } from 'react-native';
import { resolveImageUrl } from '../services/pizzariatopApi';

export const LOGO_PIZZARIATOP: ImageSourcePropType = require('../../assets/pizzariatop/logo_oficial.png');
export const PIZZA_TAMANHOS_IMG: ImageSourcePropType = require('../../assets/pizzariatop/pizza_tamanhos.png');

export const PIZZA_LOCAL_IMAGES = {
  calabresa: require('../../assets/pizzariatop/pizzas/Pizza_Calabresa.webp') as ImageSourcePropType,
  mussarela: require('../../assets/pizzariatop/pizzas/Pizza_Mussarela.webp') as ImageSourcePropType,
  quatroQueijos: require('../../assets/pizzariatop/pizzas/Pizza_4Queijos.webp') as ImageSourcePropType,
  frangoCatupiry: require('../../assets/pizzariatop/pizzas/Pizza_Frango_catupiry.webp') as ImageSourcePropType,
  bacon: require('../../assets/pizzariatop/pizzas/Pizza_Bacon.webp') as ImageSourcePropType,
  pepperoni: require('../../assets/pizzariatop/pizzas/Pizza_peperoni.webp') as ImageSourcePropType,
  vegetariana: require('../../assets/pizzariatop/pizzas/Pizza_vegetariana.webp') as ImageSourcePropType,
  rucula: require('../../assets/pizzariatop/pizzas/Pizza_Rucula.webp') as ImageSourcePropType,
  atum: require('../../assets/pizzariatop/pizzas/Pizza_Atum.webp') as ImageSourcePropType,
  lombo: require('../../assets/pizzariatop/pizzas/Pizza_Lombo.webp') as ImageSourcePropType,
  carneSeca: require('../../assets/pizzariatop/pizzas/Pizza_CaneSeca.webp') as ImageSourcePropType,
  camarao: require('../../assets/pizzariatop/pizzas/Pizza_Camarao_molhoBranco.webp') as ImageSourcePropType,
  bananaCanela: require('../../assets/pizzariatop/pizzas/Pizza_Banana_Canela.webp') as ImageSourcePropType,
  romeuJulieta: require('../../assets/pizzariatop/pizzas/Pizza_RomeuJulieta.webp') as ImageSourcePropType,
  chocolateBrancoMorango: require('../../assets/pizzariatop/pizzas/Pizza_ChocolateBranco_Morango.webp') as ImageSourcePropType,
  chocolateGranulado: require('../../assets/pizzariatop/pizzas/Pizza_Chocolate_granulado.webp') as ImageSourcePropType,
} as const;

const FALLBACK_POOL: ImageSourcePropType[] = [
  PIZZA_LOCAL_IMAGES.calabresa,
  PIZZA_LOCAL_IMAGES.mussarela,
  PIZZA_LOCAL_IMAGES.quatroQueijos,
  PIZZA_LOCAL_IMAGES.frangoCatupiry,
  PIZZA_LOCAL_IMAGES.bacon,
  PIZZA_LOCAL_IMAGES.pepperoni,
  PIZZA_LOCAL_IMAGES.vegetariana,
  PIZZA_LOCAL_IMAGES.rucula,
  PIZZA_LOCAL_IMAGES.atum,
  PIZZA_LOCAL_IMAGES.lombo,
  PIZZA_LOCAL_IMAGES.carneSeca,
  PIZZA_LOCAL_IMAGES.camarao,
  PIZZA_LOCAL_IMAGES.bananaCanela,
  PIZZA_LOCAL_IMAGES.romeuJulieta,
  PIZZA_LOCAL_IMAGES.chocolateBrancoMorango,
  PIZZA_LOCAL_IMAGES.chocolateGranulado,
];

const KEYWORD_RULES: Array<{ keywords: string[]; image: ImageSourcePropType }> = [
  {
    keywords: ['chocolate branco', 'morango', 'sensacao', 'ouro branco'],
    image: PIZZA_LOCAL_IMAGES.chocolateBrancoMorango,
  },
  {
    keywords: ['chocolate', 'brigadeiro', 'prestigio', 'nutella', 'confete', 'm&m', 'mms'],
    image: PIZZA_LOCAL_IMAGES.chocolateGranulado,
  },
  {
    keywords: ['romeu', 'julieta', 'goiabada'],
    image: PIZZA_LOCAL_IMAGES.romeuJulieta,
  },
  {
    keywords: ['banana', 'canela'],
    image: PIZZA_LOCAL_IMAGES.bananaCanela,
  },
  {
    keywords: ['4 queijos', 'quatro queijos', 'cinco queijos', 'gorgonzola', 'parmesao', 'provolone'],
    image: PIZZA_LOCAL_IMAGES.quatroQueijos,
  },
  {
    keywords: ['camarao', 'frutos do mar'],
    image: PIZZA_LOCAL_IMAGES.camarao,
  },
  {
    keywords: ['carne seca', 'nordestina', 'sertaneja', 'charque', 'sol'],
    image: PIZZA_LOCAL_IMAGES.carneSeca,
  },
  {
    keywords: ['pepperoni', 'peperoni', 'salame'],
    image: PIZZA_LOCAL_IMAGES.pepperoni,
  },
  {
    keywords: ['frango', 'catupiry', 'caipira'],
    image: PIZZA_LOCAL_IMAGES.frangoCatupiry,
  },
  {
    keywords: ['calabresa', 'toscana', 'acebolada', 'baiana'],
    image: PIZZA_LOCAL_IMAGES.calabresa,
  },
  {
    keywords: ['bacon', 'milho', 'americana'],
    image: PIZZA_LOCAL_IMAGES.bacon,
  },
  {
    keywords: ['lombo', 'canadense'],
    image: PIZZA_LOCAL_IMAGES.lombo,
  },
  {
    keywords: ['atum', 'peixe', 'aliche'],
    image: PIZZA_LOCAL_IMAGES.atum,
  },
  {
    keywords: ['rucula', 'tomate seco', 'bufala'],
    image: PIZZA_LOCAL_IMAGES.rucula,
  },
  {
    keywords: ['vegetariana', 'portuguesa', 'marguerita', 'margherita', 'napolitana', 'brocolis', 'palmito'],
    image: PIZZA_LOCAL_IMAGES.vegetariana,
  },
  {
    keywords: ['mussarela', 'mucarela', 'mozzarella', 'mozarella', 'queijo', 'tradicional'],
    image: PIZZA_LOCAL_IMAGES.mussarela,
  },
];

export function normalizePizzaText(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isUsableRemoteImage(remoteUrl?: string | null): string | null {
  if (!remoteUrl) return null;
  const trimmed = remoteUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  // Caminhos relativos antigos do frontend web (/imagens/pizza*.png, /Pizzas/*, /images/*) dão 404 na API
  if (
    lower.includes('/imagens/pizza') ||
    lower.startsWith('imagens/') ||
    lower.includes('/pizzas/') ||
    lower.includes('/images/pizza') ||
    lower.startsWith('/img/')
  ) {
    return null;
  }

  // Uploads reais salvos na API (/uploads/<arquivo>)
  if (lower.startsWith('/uploads/') || lower.startsWith('uploads/') || lower.includes('/uploads/')) {
    return resolveImageUrl(trimmed);
  }

  // URLs externas completas válidas (https://...)
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

function deterministicHashIndex(seed: string, length: number): number {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

/**
 * Retorna um ImageSourcePropType confiável para qualquer sabor/produto:
 * 1) Se `remoteUrl` for um `/uploads/...` real da API ou `https://` externa válida, usa `{ uri }`.
 * 2) Caso contrário, normaliza `nome` (NFD sem acentos) e mapeia para os 16 `.webp` oficiais locais.
 * 3) Se não houver match direto, aplica fallback determinístico por hash para nunca faltar foto.
 */
export function getPizzaImageSource(
  nome?: string | null,
  remoteUrl?: string | null
): ImageSourcePropType {
  const validRemote = isUsableRemoteImage(remoteUrl);
  if (validRemote) {
    return { uri: validRemote };
  }

  const normalized = normalizePizzaText(nome);
  if (normalized) {
    for (const rule of KEYWORD_RULES) {
      if (rule.keywords.some((kw) => normalized.includes(kw))) {
        return rule.image;
      }
    }
    return FALLBACK_POOL[deterministicHashIndex(normalized, FALLBACK_POOL.length)];
  }

  return PIZZA_LOCAL_IMAGES.calabresa;
}

const RICH_DESCRIPTIONS: Array<{ keywords: string[]; desc: string }> = [
  {
    keywords: ['calabresa'],
    desc: 'Molho de tomate artesanal, generosa camada de mussarela derretida, calabresa defumada fatiada, cebola roxa fresca e orégano chileno.',
  },
  {
    keywords: ['4 queijos', 'quatro queijos'],
    desc: 'Combinação cremosa de mussarela especial, provolone defumado, parmesão maturado e legítimo requeijão cremoso gratinado no forno.',
  },
  {
    keywords: ['frango'],
    desc: 'Peito de frango desfiado temperado com ervas finas, coberto com requeijão tipo Catupiry legítimo, milho doce e mussarela.',
  },
  {
    keywords: ['pepperoni', 'peperoni'],
    desc: 'Mussarela gratinada sobre molho pelati italiano e fatias crocantes de pepperoni levemente picante.',
  },
  {
    keywords: ['carne seca', 'nordestina'],
    desc: 'Carne seca desfiada na manteiga da terra com cebola caramelizada, mussarela especial e toque cremoso de Catupiry.',
  },
  {
    keywords: ['camarao'],
    desc: 'Camarões selecionados salteados no alho e azeite sobre molho branco aveludado, mussarela e ervas frescas.',
  },
  {
    keywords: ['chocolate branco', 'morango'],
    desc: 'Cobertura aveludada de chocolate branco nobre derretido com morangos frescos selecionados.',
  },
  {
    keywords: ['chocolate', 'brigadeiro'],
    desc: 'Ganache cremosa de chocolate ao leite com chuva generosa de granulado crocante.',
  },
  {
    keywords: ['romeu', 'julieta'],
    desc: 'Clássico irresistível de queijo mussarela cremoso com fatias generosas de goiabada cascão artesanal.',
  },
  {
    keywords: ['banana'],
    desc: 'Fatias de banana madura caramelizadas com açúcar mascavo, toque aromático de canela e leite condensado.',
  },
];

export function getPizzaRichDescription(
  nome?: string | null,
  fallback?: string | null
): string {
  if (fallback && fallback.trim().length > 12) {
    return fallback.trim();
  }
  const normalized = normalizePizzaText(nome);
  for (const item of RICH_DESCRIPTIONS) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return item.desc;
    }
  }
  return (
    fallback?.trim() ||
    'Massa de fermentação lenta assada em alta temperatura com ingredientes frescos selecionados da Pizzaria TOP.'
  );
}
