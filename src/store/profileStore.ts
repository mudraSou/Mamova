import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type DeliveryType = 'vaginal' | 'c-section';

export interface Profile {
  baby_name: string | null;
  delivery_date: string;       // ISO date 'YYYY-MM-DD'
  delivery_type: DeliveryType;
}

export interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  saveProfile: (data: Profile) => Promise<void>;
  clearProfile: () => Promise<void>;

  dayN: () => number;
  isFirstWeek: () => boolean;
  isCSection: () => boolean;
}

const PROFILE_KEY = 'mamova_profile';

async function readStored(): Promise<Profile | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(PROFILE_KEY);
    } else {
      raw = await SecureStore.getItemAsync(PROFILE_KEY);
    }
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

async function writeStored(p: Profile): Promise<void> {
  const raw = JSON.stringify(p);
  if (Platform.OS === 'web') {
    localStorage.setItem(PROFILE_KEY, raw);
  } else {
    await SecureStore.setItemAsync(PROFILE_KEY, raw);
  }
}

async function deleteStored(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(PROFILE_KEY);
  } else {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  }
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
  profile: null,
  isLoading: true,

  initialize: async () => {
    const profile = await readStored();
    set({ profile, isLoading: false });
  },

  saveProfile: async (data) => {
    set({ isLoading: true });
    await writeStored(data);
    set({ profile: data, isLoading: false });
  },

  clearProfile: async () => {
    await deleteStored();
    set({ profile: null });
  },

  dayN: () => {
    const p = get().profile;
    if (!p?.delivery_date) return 1;
    return calcDayN(p.delivery_date);
  },

  isFirstWeek: () => get().dayN() <= 7,
  isCSection:  () => get().profile?.delivery_type === 'c-section',
}));
