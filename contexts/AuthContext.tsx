
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

  const mapUser = (fbUser: User): VJUser => {
    return {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Maker',
      handle: `@${fbUser.email?.split('@')[0] || 'user'}`,
      avatar: fbUser.photoURL || 'https://picsum.photos/seed/vj/100',
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // 1. If Firebase User exists, prioritize it over demo
      if (fbUser) {
        localStorage.removeItem(DEMO_SESSION_KEY);
        const vjUser = mapUser(fbUser);
        setSession({ mode: "real", user: vjUser, createdAt: Date.now() });

        // Fetch or Create Profile
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              id: fbUser.uid,
              username: data.handle?.replace('@', '') || vjUser.handle.replace('@', ''),
              display_name: data.displayName || vjUser.name,
              avatar_url: data.avatarUrl || vjUser.avatar,
              bio: data.bio || ''
            });
          } else {
            // Auto-create MVP profile
            const newProfile = {
              displayName: vjUser.name,
              handle: vjUser.handle.replace('@', ''),
              avatarUrl: vjUser.avatar,
              createdAt: serverTimestamp(),
              followersCount: 0,
              followingCount: 0,
              bookmarksCount: 0
            };
            await setDoc(userDocRef, newProfile);
            setProfile({
              id: fbUser.uid,
              username: newProfile.handle,
              display_name: newProfile.displayName,
              avatar_url: newProfile.avatarUrl,
              bio: ''
            });
          }
        } catch (e) {
          console.error("Profile fetch error", e);
        }
      } else {
        // 2. Fallback to Demo if no real user
        const hasDemo = hydrateDemo();
        if (!hasDemo) {
          setSession(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hydrateDemo]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
    await firebaseSignOut(auth);
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
