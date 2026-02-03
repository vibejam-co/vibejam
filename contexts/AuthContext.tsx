import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  badges: any[]; // JSONB
  created_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  signInWithGoogle: async () => { },
  refreshProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initStarted = useRef(false);

  // Helper to generate a unique handle
  const ensureUniqueHandle = async (base: string): Promise<string> => {
    let candidate = base.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);
    if (!candidate) candidate = `user_${Math.random().toString(36).slice(2, 7)}`;

    // Simple check
    const { data } = await supabase.from('profiles').select('handle').eq('handle', candidate).maybeSingle();
    if (data) {
      return `${candidate}_${Math.floor(Math.random() * 1000)}`;
    }
    return candidate;
  };

  // Fetch or create profile row
  const hydrateProfile = async (supaUser: User) => {
    try {
      console.log(`[Auth] Hydrating profile for ${supaUser.id}`);

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle();

      const metadata = supaUser.user_metadata || {};
      const googleName = metadata.full_name || metadata.name || null;
      const googleAvatar = metadata.avatar_url || metadata.picture || null;

      if (!existingProfile) {
        console.log(`[Auth] Creating new profile for ${supaUser.id}`);

        const emailPrefix = supaUser.email?.split('@')[0] || 'user';
        const finalHandle = await ensureUniqueHandle(emailPrefix);

        // AWARD FOUNDER BADGE
        const founderBadge = {
          type: 'founding_creator',
          tier: 10,
          prestige_label: 'FOUNDER',
          aura_color: '#E6C89A',
          earned_at: new Date().toISOString(),
          source: 'system'
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supaUser.id,
            display_name: googleName || finalHandle,
            avatar_url: googleAvatar,
            handle: finalHandle,
            bio: null, // explicit null as per requirements
            badges: [founderBadge]
          })
          .select()
          .single();

        if (insertError) {
          console.error("[Auth] Profile creation error", insertError);
        } else {
          setProfile(newProfile);
        }
      } else {
        // Update existing profile with Google metadata if missing (optional, but good for sync)
        // We strictly follow "Real Data" rule - if it's there, use it.
        const updates: Partial<Profile> = {};
        // Only auto-update if strictly necessary or requested. 
        // Requirement A: Avatar resolution order -> profiles.avatar_url > OAuth. 
        // So we don't blindly overwrite unless empty.

        let dirty = false;
        if (!existingProfile.avatar_url && googleAvatar) {
          updates.avatar_url = googleAvatar;
          dirty = true;
        }

        if (dirty) {
          const { data: updated } = await supabase.from('profiles').update(updates).eq('id', supaUser.id).select().single();
          setProfile(updated || existingProfile);
        } else {
          setProfile(existingProfile);
        }
      }
    } catch (e) {
      console.error("[Auth] Profile hydration error", e);
    }
  };

  const handleAuthState = async (supaSession: Session | null, eventName: string) => {
    console.log(`[Auth] onAuthStateChange: ${eventName} ${supaSession ? '(User active)' : '(No user)'}`);

    setSession(supaSession);
    const currentUser = supaSession?.user || null;
    setUser(currentUser);

    if (currentUser) {
      await hydrateProfile(currentUser);
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    console.log('%c[Auth] Initializing authentication (REAL mode)...', 'color: #3ecf8e; font-weight: bold;');

    const initializeAuth = async () => {
      // Standard session check + validate token
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          const { error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.warn('[Auth] Invalid session detected, signing out...', userError.message);
            await supabase.auth.signOut();
            await handleAuthState(null, 'INVALID_SESSION');
            return;
          }
        }
        await handleAuthState(currentSession, 'INITIAL_SESSION');
      } catch (e) {
        console.error('[Auth] Session check failed:', e);
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, supaSession: Session | null) => {
        handleAuthState(supaSession, event);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("[Auth] Google Login failed", error);
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      signOut,
      signInWithGoogle,
      refreshProfile: async () => { if (user) await hydrateProfile(user); }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
