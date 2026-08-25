import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'tasker_ai_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim()
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse Supabase config from localStorage:', e);
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

  return {
    url: envUrl,
    anonKey: envKey
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  initSupabaseClient();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  initSupabaseClient();
}

function checkIsConfigured(cfg: SupabaseConfig): boolean {
  return Boolean(
    cfg.url &&
    cfg.anonKey &&
    cfg.url.startsWith('http') &&
    !cfg.url.includes('your-project')
  );
}

let activeConfig = getSupabaseConfig();
export let isSupabaseConfigured = checkIsConfigured(activeConfig);
export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeConfig.url, activeConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  : null;

export function initSupabaseClient(): SupabaseClient | null {
  activeConfig = getSupabaseConfig();
  isSupabaseConfigured = checkIsConfigured(activeConfig);
  if (isSupabaseConfigured) {
    supabase = createClient(activeConfig.url, activeConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
  } else {
    supabase = null;
  }
  return supabase;
}
