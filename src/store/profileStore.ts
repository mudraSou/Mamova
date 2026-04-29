import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase, type DbProfile } from '@/lib/supabase';

export type DeliveryType = 'vaginal' | 'c-section';

export interface Profile {
  id:            string;
  pin:           string;
  mother_name:   string | null;
  partner_name:  string | null;
  baby_name:     string | null;
  delivery_date: string;       // ISO date 'YYYY-MM-DD'
  delivery_type: DeliveryType;
}

export type NewProfileData = Omit<Profile, 'id' | 'pin'>;

export interface ProfileState {
  profile:   Profile | null;
  isLoading: boolean;
  error:     string | null;

  initialize:  () => Promise<void>;
  saveProfile: (data: NewProfileData) => Promise<Profile>;
  joinByPin:   (pin: string) => Promise<Profile>;
  clearProfile:() => Promise<void>;

  dayN:        () => number;
  isFirstWeek: () => boolean;
  isCSection:  () => boolean;
}

// ── Local storage key — stores only the profile UUID ──────────────
const PROFILE_ID_KEY = 'mamova_profile_id';

async function readProfileId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(PROFILE_ID_KEY);
    return await SecureStore.getItemAsync(PROFILE_ID_KEY);
  } catch { return null; }
}

async function writeProfileId(id: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(PROFILE_ID_KEY, id); return; }
  await SecureStore.setItemAsync(PROFILE_ID_KEY, id);
}

async function deleteProfileId(): Promise<void> {
  if (Platform.OS === 'web') { localStorage.removeItem(PROFILE_ID_KEY); return; }
  await SecureStore.deleteItemAsync(PROFILE_ID_KEY);
}

function dbToProfile(row: DbProfile): Profile {
  return {
    id:           row.id,
    pin:          row.pin,
    mother_name:  row.mother_name,
    partner_name: row.partner_name,
    baby_name:    row.baby_name,
    delivery_date:row.delivery_date,
    delivery_type:row.delivery_type,
  };
}

/** Generates a random 6-digit PIN string. */
function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Clinical convention: Day 1 = birth day. Exported for unit testing. */
export function calcDayN(deliveryDate: string, today = new Date()): number {
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - delivery.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile:   null,
  isLoading: true,
  error:     null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const id = await readProfileId();
      if (!id) { set({ profile: null, isLoading: false }); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        // Profile deleted remotely — clear local pointer
        await deleteProfileId();
        set({ profile: null, isLoading: false });
        return;
      }
      set({ profile: dbToProfile(data as DbProfile), isLoading: false });
    } catch {
      set({ profile: null, isLoading: false });
    }
  },

  saveProfile: async (data) => {
    set({ isLoading: true, error: null });
    // Try up to 5 PINs to avoid collision
    let profile: Profile | null = null;
    for (let i = 0; i < 5; i++) {
      const pin = generatePin();
      const { data: row, error } = await supabase
        .from('profiles')
        .insert({
          pin,
          mother_name:   data.mother_name,
          partner_name:  data.partner_name,
          baby_name:     data.baby_name,
          delivery_date: data.delivery_date,
          delivery_type: data.delivery_type,
        })
        .select()
        .single();

      if (!error && row) {
        profile = dbToProfile(row as DbProfile);
        break;
      }
      // If unique constraint violation on pin, retry; otherwise rethrow
      if (error && !error.message.includes('unique')) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    }
    if (!profile) throw new Error('Could not generate a unique PIN. Please try again.');
    await writeProfileId(profile.id);
    set({ profile, isLoading: false });
    return profile;
  },

  joinByPin: async (pin) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('pin', pin.trim())
      .single();

    if (error || !data) {
      const msg = 'No profile found with that PIN. Please check and try again.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
    const profile = dbToProfile(data as DbProfile);
    await writeProfileId(profile.id);
    set({ profile, isLoading: false });
    return profile;
  },

  clearProfile: async () => {
    await deleteProfileId();
    set({ profile: null, error: null });
  },

  dayN: () => {
    const p = get().profile;
    if (!p?.delivery_date) return 1;
    return calcDayN(p.delivery_date);
  },

  isFirstWeek: () => get().dayN() <= 7,
  isCSection:  () => get().profile?.delivery_type === 'c-section',
}));
