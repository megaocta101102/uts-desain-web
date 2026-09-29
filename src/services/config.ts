import { AppConfig } from '../types';

export const DEFAULT_CONFIG: AppConfig = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ctcjauwqpfnvmcujvzoc.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  CAFE_NAME: import.meta.env.VITE_CAFE_NAME || 'Meo Cafe',
  CAFE_TAGLINE: import.meta.env.VITE_CAFE_TAGLINE || 'Aesthetic & Modern Coffee House',
  CAFE_ADDRESS: import.meta.env.VITE_CAFE_ADDRESS || 'Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang',
  CAFE_MAPS_URL: 'https://maps.app.goo.gl/834Rms4rBLfc3tZu7',
  OWNER_NAME: import.meta.env.VITE_OWNER_NAME || 'Mega Octa',
  CAFE_CURRENCY: 'Rp',
  CAFE_TAX_PERCENT: 10,
  CAFE_SERVICE_PERCENT: 0,
  PAGE_SIZE: 8,
};

let cachedConfig: AppConfig | null = null;

export async function fetchAppConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const serverConfig = await res.json();
      cachedConfig = {
        ...DEFAULT_CONFIG,
        ...serverConfig,
      };
      return cachedConfig as AppConfig;
    }
  } catch {
    // fallback to env/defaults
  }

  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function formatCurrency(amount: number): string {
  return `${DEFAULT_CONFIG.CAFE_CURRENCY} ${Number(amount || 0).toLocaleString('id-ID')}`;
}
