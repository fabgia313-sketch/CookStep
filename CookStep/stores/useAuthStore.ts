import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

// Required for expo-web-browser OAuth redirect to close automatically
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;

  /** Called once on app start — reads stored session and subscribes to changes */
  initialize: (onSessionChange: (session: Session | null) => void) => () => void;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  loading: false,
  error: null,

  initialize: (onSessionChange) => {
    // Read initial session from Supabase (already persisted in AsyncStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, initialized: true });
      onSessionChange(session);
    });

    // Subscribe to future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      set({ session, user: session?.user ?? null });
      onSessionChange(session);
    });

    return () => subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      throw error;
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const redirectTo = makeRedirectUri({ scheme: 'cookstep', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') {
          set({ loading: false });
          return;
        }
        // Session will be updated via onAuthStateChange listener
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur Google Sign-In';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
