import { create } from 'zustand';
import { supabase, type Profile } from '@/lib/supabase';

export type DeliveryType = 'vaginal' | 'c-section';

export interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  saveProfile: (data: Omit<Profile, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  clearProfile: () => void;

  // Derived helpers
  dayN: () => number;
  isFirstWeek: () => boolean;
  isCSection: () => boolean;
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
  isLoading: false,
  error: null,

  fetchProfile: async (userId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({ profile: data ?? null, isLoading: false });
  },

  saveProfile: async (data) => {
    set({ isLoading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Not authenticated', isLoading: false }); return; }

    const payload = { ...data, user_id: user.id };
    const { data: saved, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) { set({ error: error.message, isLoading: false }); return; }
    set({ profile: saved, isLoading: false });
  },

  clearProfile: () => set({ profile: null }),

  dayN: () => {
    const p = get().profile;
    if (!p?.delivery_date) return 1;
    return calcDayN(p.delivery_date);
  },

  isFirstWeek: () => get().dayN() <= 7,
  isCSection:  () => get().profile?.delivery_type === 'c-section',
}));
