// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '../lib/supabase';
import { User } from '../types/core';
import { initializeAuth, storeAuthSession, clearAuthSession } from '../services/authService';
import { userService } from '../services/userService';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';


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
  const [authChecked, setAuthChecked] = useState(false);

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setAuthChecked(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  const updateUser = async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        // 1. First, initialize auth from storage
        const storedAuth = await initializeAuth();
  
        // 2. THEN get the current session
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
  
        // 3. Set up auth state change listener
        
const { data: listenerData } = supabase.auth.onAuthStateChange(
  async (event: AuthChangeEvent, session: Session | null) => {
    setSession(session);
    if (session?.user) {
      await loadUserProfile(session.user.id);
      await storeAuthSession(session);
    } else {
      setUser(null);
      setLoading(false);
      await clearAuthSession();
    }
  }
);
const subscription = listenerData.subscription;
  
        return () => subscription.unsubscribe();
  
      } catch (error) {
        console.error('❌ Error in auth initialization:', error);
        setLoading(false);
      }
    };
  
    // Call the complete initialization
    initializeAuthState();
  
  }, []);
  const loadUserProfile = async (userId: string) => {
    
    if (!userId) {
      setLoading(false);
      return;
    }
  
    try {
      const userProfile = await userService.getUser(userId);
      setUser(userProfile);
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
      // Always create a fallback user
        const fallbackUser: User = {
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          displayName: 'New User',
          avatarUrl: undefined,
          bio: undefined,
          roles: ['supporter'],
          joinedDate: new Date(),
        };
        setUser(fallbackUser);
      } finally {
        // CRITICAL: Always set loading to false
        setLoading(false);
      }
    };
  

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const supabase = getSupabase();
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
    const signIn = async (email: string, password: string) => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
        if (error) throw error;
  
        if (data.session) {
          await storeAuthSession(data.session);
        }
  
        if (data.user) {
          await loadUserProfile(data.user.id);
        }
      
      } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
      }
    };
  

  const signOut = async () => {
    try {
      const supabase = getSupabase();
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