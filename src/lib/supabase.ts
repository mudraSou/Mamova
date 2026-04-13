import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

// ── Env vars — set in .env or eas.json secrets ────────────────────
const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON ?? '';

// ── Secure token storage (replaces localStorage on native) ───────
const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Keep session alive when app is foregrounded ──────────────────
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// ── Database types (extend as schema grows) ──────────────────────
export type Profile = {
  id: string;
  user_id: string;
  baby_name: string | null;
  delivery_date: string;       // ISO date 'YYYY-MM-DD'
  delivery_type: 'vaginal' | 'c-section';
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  content_type: 'symptom' | 'position';
  content_slug: string;
  created_at: string;
};
