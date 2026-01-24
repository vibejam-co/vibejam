
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, User, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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
  username: string; // handle without @
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

const DEMO_SESSION_KEY = 'vj_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<VJSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateDemo = useCallback(() => {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.user?.id) {
          setSession(data);
          setProfile({
            id: data.user.id,
            username: data.user.handle.replace('@', ''),
            display_name: data.user.name,
            avatar_url: data.user.avatar,
            bio: 'Demo curator mode active.'
          });
          return true;
        }
      }
    } catch (e) {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
    return false;
  }, []);

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
    if (!supabase) return;

    try {
      // Try to get existing profile
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (existingProfile && !error) {
        setProfile({
          id: supaUser.id,
          username: existingProfile.username || vjUser.handle.replace('@', ''),
          display_name: existingProfile.display_name || vjUser.name,
          avatar_url: existingProfile.avatar_url || vjUser.avatar,
          bio: existingProfile.bio || ''
        });
      } else {
        // Create new profile
        const newProfile = {
          id: supaUser.id,
          username: vjUser.handle.replace('@', ''),
          display_name: vjUser.name,
          avatar_url: vjUser.avatar,
          bio: '',
          created_at: new Date().toISOString()
        };

        await supabase.from('profiles').upsert(newProfile);

        setProfile({
          id: supaUser.id,
          username: newProfile.username,
          display_name: newProfile.display_name,
          avatar_url: newProfile.avatar_url,
          bio: ''
        });
      }
    } catch (e) {
      console.error("Profile fetch error", e);
    }
  };

  useEffect(() => {
    // If Supabase is not configured, fall back to demo mode
    if (!supabase) {
      console.warn('[Auth] Supabase not configured. Demo mode only.');
      hydrateDemo();
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (supaSession?.user) {
        localStorage.removeItem(DEMO_SESSION_KEY);
        const vjUser = mapUser(supaSession.user);
        setSession({ mode: "real", user: vjUser, createdAt: Date.now() });
        fetchOrCreateProfile(supaSession.user, vjUser);
      } else {
        hydrateDemo();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supaSession) => {
        if (supaSession?.user) {
          localStorage.removeItem(DEMO_SESSION_KEY);
          const vjUser = mapUser(supaSession.user);
          setSession({ mode: "real", user: vjUser, createdAt: Date.now() });
          fetchOrCreateProfile(supaSession.user, vjUser);
        } else {
          const hasDemo = hydrateDemo();
          if (!hasDemo) {
            setSession(null);
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [hydrateDemo]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error("Supabase not configured");
      alert("Authentication is not available. Please use Demo Login.");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const signInDemo = () => {
    const demo: VJSession = {
      mode: "demo",
      user: {
        id: "demo_" + Math.random().toString(36).slice(2, 7),
        name: "Demo Curator",
        handle: "@demo",
        avatar: "https://picsum.photos/seed/demo/100",
      },
      createdAt: Date.now(),
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demo));
    hydrateDemo();
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      profile,
      loading,
      isDemo: session?.mode === 'demo',
      signOut,
      signInDemo,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
