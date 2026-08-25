import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
}

export const authService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (err) {
      console.warn('Failed to fetch current user:', err);
      return null;
    }
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (err) {
      console.warn('Failed to fetch session:', err);
      return null;
    }
  },

  async signInWithGoogle(): Promise<{ error: string | null }> {
    if (!supabase) {
      return {
        error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href.split('#')[0]
        }
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to initiate Google sign in.' };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign out.' };
    }
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};
