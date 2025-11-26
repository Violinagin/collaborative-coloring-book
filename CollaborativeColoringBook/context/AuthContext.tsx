// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/User';
import { directSupabaseService } from '../services/directSupabaseService';

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

  const updateUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

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

  const loadUserProfile = async (userId: string) => {
    
    if (!userId) {
      console.error('❌ AuthContext: Cannot load user profile: empty user ID');
      setLoading(false);
      return;
    }
  
    try {

      const userProfile = await directSupabaseService.getUser(userId);
      setUser(userProfile);
    } catch (error) {
      console.error('❌ AuthContext: Error loading user profile:', error);
      // Even if there's an error, create a basic user object to prevent crashes
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
        recentActivity: [],
      };
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };
  

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    console.log('Supabase auth response:', { data, error });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    
    // User profile will be created automatically by our trigger
    if (data.user) {
      // Wait a moment for the trigger to create the profile, then load it
      setTimeout(() => {
        loadUserProfile(data.user!.id);
      }, 2000); // Increased delay to ensure trigger has time
      } else {
      console.log('No user object in response');
      }
    };

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user.id);
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      // The auth state change listener will handle setting user to null
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateUser,
    }}>
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