// @/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/config/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,   // false: jangan block UI — user mungkin sudah ada dari persist
      initialized: false,

      setUser: (user) => set({ user, loading: false, initialized: true }),

      loadUser: async () => {
        try {
          set({ loading: true });

          // Get current session
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.user) {
            set({ user: null, loading: false, initialized: true });
            return;
          }

          // Fetch user data from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('[AUTH] Error loading user:', error);
            // Fallback ke data session agar tidak logout user
            set({
              user: {
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name,
                avatar_url: session.user.user_metadata?.avatar_url,
                role: session.user.user_metadata?.role,
              },
              loading: false,
              initialized: true,
            });
            return;
          }

          set({
            user: userData as User,
            loading: false,
            initialized: true,
          });

        } catch (error) {
          console.error('[AUTH] Exception:', error);
          set({ user: null, loading: false, initialized: true });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, loading: false, initialized: true });
      },
    }),
    {
      name: 'auth-storage',
      // Hanya persist user saja — loading/initialized selalu fresh saat app reload
      partialize: (state) => ({ user: state.user }),
    }
  )
);