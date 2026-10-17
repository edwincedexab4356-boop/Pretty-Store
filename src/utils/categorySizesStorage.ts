/**
 * Utilidad para configurar y obtener tamaños / tallas por categoría o producto.
 * Permite a los clientes seleccionar su tamaño o talla antes de agregar al carrito.
 */

export interface CategorySizeConfig {
  categoryId: string;
  enabled: boolean;
  label: string;
  options: string[];
}

const STORAGE_KEY = 'pretty_store_category_sizes_v1';

export const SIZE_PRESETS = {
  pastelitos: {
    name: 'Pastelitos (Pequeño y Grande)',
    label: 'Tamaño',
    options: ['Pequeño', 'Grande'],
  },
  perfumes: {
    name: 'Perfumes (Presentación y Mililitros)',
    label: 'Presentación',
    options: ['Frasco Estándar', '30 ml', '50 ml', '100 ml'],
  },
  ropa: {
    name: 'Ropa / Moda (S, M, L, XL)',
    label: 'Talla',
    options: ['S', 'M', 'L', 'XL'],
  },
  calzado: {
    name: 'Calzado / Sneakers (Medidas US)',
    label: 'Talla US',
    options: ['7 US', '8 US', '8.5 US', '9 US', '9.5 US', '10 US', '10.5 US', '11 US'],
  },
};

function clean(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function extractSizeConfigFromDescription(description: string = ''): Partial<CategorySizeConfig> | null {
  if (!description) return null;
  const match = description.match(/<!--sizes:(\{.*?\})-->/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  return null;
}

export function embedSizeConfigInDescription(description: string = '', config: CategorySizeConfig): string {
  const cleanDesc = description.replace(/<!--sizes:\{.*?\}-->/g, '').trim();
  if (!config.enabled || !config.options || config.options.length === 0) {
    return cleanDesc;
  }
  const payload = JSON.stringify({
    enabled: config.enabled,
    label: config.label || 'Tamaño',
    options: config.options,
  });
  return cleanDesc ? `${cleanDesc} <!--sizes:${payload}-->` : `<!--sizes:${payload}-->`;
}

export function getCleanDescription(description: string = ''): string {
  if (!description) return '';
  return description.replace(/<!--sizes:\{.*?\}-->/g, '').trim();
}

export function isCapOrGorra(categoryName: string = '', productName: string = ''): boolean {
  const text = `${clean(categoryName)} ${clean(productName)}`;
  return text.includes('gorra') || text.includes('cap') || text.includes('beisbolera') || text.includes('snapback') || text.includes('belica') || text.includes('legendaria');
}

export function getDefaultSizesForCategory(categoryName: string = '', productName: string = ''): CategorySizeConfig {
  if (isCapOrGorra(categoryName, productName)) {
    return {
      categoryId: '',
      enabled: false,
      label: '',
      options: [],
    };
  }

  const text = `${clean(categoryName)} ${clean(productName)}`;

  if (text.includes('pastel') || text.includes('pastelito')) {
    return {
      categoryId: '',
      enabled: true,
      label: 'Tamaño de Pastelito',
      options: text.includes('pequeno')
        ? ['Pequeño']
        : text.includes('grande')
        ? ['Grande']
        : ['Pequeño', 'Grande'],
    };
  }

  if (text.includes('perfume') || text.includes('colonia') || text.includes('fragancia')) {
    return {
      categoryId: '',
      enabled: true,
      label: 'Presentación',
      options: ['Frasco Estándar', '30 ml', '50 ml', '100 ml'],
    };
  }

  if (text.includes('reloj') || text.includes('joefox')) {
    return {
      categoryId: '',
      enabled: true,
      label: 'Ajuste de Pulsera',
      options: ['Estándar Ajustable', 'Con Eslabones Extra'],
    };
  }

  return {
    categoryId: '',
    enabled: false,
    label: 'Tamaño / Talla',
    options: ['Único'],
  };
}

export function getAllCategorySizeConfigs(): Record<string, CategorySizeConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCategorySizeConfig(config: CategorySizeConfig) {
  if (typeof window === 'undefined' || !config.categoryId) return;
  try {
    const all = getAllCategorySizeConfigs();
    all[config.categoryId] = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Error al guardar tamaño de categoría:', err);
  }
}

export function resolveSizeOptions(
  categoryId?: string | null,
  categoryName?: string,
  productName?: string,
  categoryDescription?: string
): { enabled: boolean; label: string; options: string[] } {
  // Las gorras no tienen tallas por solicitud expresa del usuario
  if (isCapOrGorra(categoryName || '', productName || '')) {
    return {
      enabled: false,
      label: '',
      options: [],
    };
  }

  const allConfigs = getAllCategorySizeConfigs();
  if (categoryId && allConfigs[categoryId]) {
    const custom = allConfigs[categoryId];
    if (custom.enabled && custom.options && custom.options.length > 0) {
      return {
        enabled: true,
        label: custom.label || 'Tamaño / Talla',
        options: custom.options,
      };
    }
  }

  if (categoryDescription) {
    const embedded = extractSizeConfigFromDescription(categoryDescription);
    if (embedded && embedded.enabled && embedded.options && embedded.options.length > 0) {
      return {
        enabled: true,
        label: embedded.label || 'Tamaño / Talla',
        options: embedded.options,
      };
    }
  }

  const fallback = getDefaultSizesForCategory(categoryName || '', productName || '');
  return {
    enabled: fallback.enabled,
    label: fallback.label,
    options: fallback.options,
  };
}
