import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface VJUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

export interface VJSession {
  mode: "demo" | "real";
  user: VJUser;
  createdAt: number;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
}

interface AuthContextType {
  user: VJUser | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDemo: false,
  signOut: async () => { },
  signInDemo: () => { },
  signInWithGoogle: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<VJSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initStarted = useRef(false);

  const mapUser = (supaUser: User): VJUser => {
    const email = supaUser.email || '';
    const metadata = supaUser.user_metadata || {};
    return {
      id: supaUser.id,
      name: metadata.full_name || metadata.name || email.split('@')[0] || 'Maker',
      handle: `@${email.split('@')[0] || 'user'}`,
      avatar: metadata.avatar_url || metadata.picture || 'https://picsum.photos/seed/vj/100',
    };
  };

  const fetchOrCreateProfile = async (supaUser: User, vjUser: VJUser) => {
    try {
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (existingProfile && !error) {
        setProfile({
          id: supaUser.id,
          username: existingProfile.handle || vjUser.handle.replace('@', ''),
          display_name: existingProfile.display_name || vjUser.name,
          avatar_url: existingProfile.avatar_url || vjUser.avatar,
          bio: existingProfile.bio || ''
        });
      } else {
        const newProfile = {
          id: supaUser.id,
          handle: vjUser.handle.replace('@', ''),
          display_name: vjUser.name,
          avatar_url: vjUser.avatar,
          bio: '',
          created_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase.from('profiles').upsert(newProfile);
        if (upsertError) console.error("[Auth] Profile upsert error", upsertError);

        setProfile({
          id: supaUser.id,
          username: newProfile.handle,
          display_name: newProfile.display_name,
          avatar_url: newProfile.avatar_url,
          bio: ''
        });
      }
    } catch (e) {
      console.error("[Auth] Profile fetch error", e);
    }
  };

  const handleAuthUser = async (supaUser: User | null, eventName: string) => {
    console.log(`[Auth] Event: ${eventName} ${supaUser ? '(User active)' : '(No user)'}`);

    if (supaUser) {
      console.log(`[Auth] User id: ${supaUser.id}`);
      const vjUser = mapUser(supaUser);
      setSession({ mode: "real", user: vjUser, createdAt: Date.now() });
      await fetchOrCreateProfile(supaUser, vjUser);
    } else {
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Prevent double-init from React Strict Mode
    if (initStarted.current) return;
    initStarted.current = true;

    console.log('%c[Auth] Initializing authentication (REAL mode)...', 'color: #3ecf8e; font-weight: bold;');

    const initializeAuth = async () => {
      // 1. Check for tokens in URL (Implicit Flow) - Manual Handling
      // This is necessary because automatic detection can be flaky in some production environments
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('[Auth] Detected tokens in URL, attempting manual session set...');
        try {
          const params = new URLSearchParams(hash.substring(1)); // remove #
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;

            if (data.session) {
              console.log('[Auth] Manual session set successful');
              await handleAuthUser(data.session.user, 'MANUAL_URL_Hydration');
              // Validate and persist explicitly (double-check)
              localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));

              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
              return; // Exit early as we're done
            }
          }
        } catch (e) {
          console.error('[Auth] Manual session set failed:', e);
        }
      }

      // 2. Initial session check (if not handled by manual hydration)
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] getSession error:', error.message);
          setLoading(false);
          return;
        }
        if (currentSession?.user) {
          console.log('[Auth] Found existing session:', currentSession.user.id);
          await handleAuthUser(currentSession.user, 'INITIAL_SESSION');
        } else {
          console.log('[Auth] No session found');
          setLoading(false);
        }
      } catch (e) {
        console.error('[Auth] Session check failed:', e);
        setLoading(false);
      }
    };

    // Execute initialization
    initializeAuth();

    // 3. Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, supaSession: Session | null) => {
        console.log(`[Auth] onAuthStateChange: ${event}`);

        // Defer to next tick to avoid React batching issues
        setTimeout(() => {
          // Only handle if we haven't just manually hydrated (avoid race w/ manual set)
          handleAuthUser(supaSession?.user || null, event);
        }, 0);
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
      console.error("[Auth] Login failed", error);
    }
  };

  const signInDemo = () => {
    alert("Demo Mode is disabled. Please Sign in with Google.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      profile,
      loading,
      isDemo: false,
      signOut,
      signInDemo,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
