import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// ── Env vars — inlined by Metro at build time ─────────────────────
const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON ?? '';

// ── Storage adapter — SecureStore on native, localStorage on web ──
const getStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem:    (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
  const SecureStore = require('expo-secure-store');
  return {
    getItem:    (key: string) => SecureStore.getItemAsync(key),
    setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: getStorageAdapter(),
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// ── Database types ────────────────────────────────────────────────
export type DbProfile = {
  id:            string;
  pin:           string;
  mother_name:   string | null;
  partner_name:  string | null;
  baby_name:     string | null;
  delivery_date: string;       // ISO date 'YYYY-MM-DD'
  delivery_type: 'vaginal' | 'c-section';
  created_at:    string;
};
