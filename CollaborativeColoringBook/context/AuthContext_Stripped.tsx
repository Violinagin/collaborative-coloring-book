// context/AuthContext.tsx - TEMPORARY MINIMAL VERSION
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/core';

// ❌ TEMPORARILY REMOVE ALL SERVICE IMPORTS
// import { userService } from '../services/userService';
// import { storeAuthSession } from '../services/authService';

type AuthContextType = {
  user: User | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ SIMPLIFIED loadUserProfile - no services
  const loadUserProfile = async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Direct Supabase call - no services
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Create basic user
        const fallbackUser: User = {
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          displayName: 'User',
          avatarUrl: '👤',
          bio: 'Welcome!',
          roles: ['supporter'],
          joinedDate: new Date(),
          uploadedArtworks: [],
          colorizedVersions: [],
          likedArtworks: [],
        };
        setUser(fallbackUser);
      } else {
        // Transform manually
        const userProfile: User = {
          id: data.id,
          username: data.username,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          bio: data.bio,
          roles: data.roles,
          joinedDate: new Date(data.created_at),
          uploadedArtworks: [],
          colorizedVersions: [],
          likedArtworks: [],
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      const fallbackUser: User = {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        displayName: 'New User',
        avatarUrl: '👤',
        bio: 'Welcome!',
        roles: ['supporter'],
        joinedDate: new Date(),
        uploadedArtworks: [],
        colorizedVersions: [],
        likedArtworks: [],
      };
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your AuthContext methods (simplified without service calls)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    // Simplified without services
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });

    if (error) throw error;
    
    if (data.user) {
      setTimeout(() => {
        loadUserProfile(data.user!.id);
      }, 2000);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};