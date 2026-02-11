// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getSupabase } from '../lib/supabase';
import { User } from '../types/core';
import { initializeAuth, storeAuthSession, clearAuthSession } from '../services/authService';
import { userService } from '../services/api/users';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: () => Promise<void>;
  refreshUserWithSocial: () => Promise<void>; // ✅ NEW: For profile page
  loadLeanUserProfile: () => Promise<void>;    // ✅ NEW: For edit profile screen
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
  // Add at the top of AuthProvider
const lastProcessedEvent = useRef<{ 
  event: string; 
  userId: string; 
  timestamp: number 
} | null>(null);
const supabase = getSupabase();

const { data: listenerData } = supabase.auth.onAuthStateChange(
  async (event: AuthChangeEvent, session: Session | null) => {
    console.log(`🎯 Raw auth event: ${event}`);
    
    // ⭐ FILTER EVENTS - Only handle specific ones
    const eventsToHandle = ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'];
    
    if (!eventsToHandle.includes(event)) {
      console.log(`⏭️ Ignoring event: ${event}`);
      return;
    }
    if (event === 'SIGNED_IN' && user?.id === session?.user?.id) {
      console.log('⏭️ Ignoring duplicate SIGNED_IN for same user');
      return;
    }
    
    // ⭐ DEDUPLICATION
    const now = Date.now();
    const eventKey = `${event}-${session?.user?.id || 'none'}`;
    
    if (lastProcessedEvent.current) {
      const { event: lastEvent, userId: lastUserId, timestamp: lastTime } = lastProcessedEvent.current;
      const isDuplicate = eventKey === `${lastEvent}-${lastUserId}`;
      const isRecent = now - lastTime < 2000; // 2 second cooldown
      
      if (isDuplicate && isRecent) {
        console.log(`⏭️ Skipping duplicate: ${event}`);
        return;
      }
    }
    
    lastProcessedEvent.current = {
      event,
      userId: session?.user?.id || 'none',
      timestamp: now
    };
    
    console.log(`🎯 Handling: ${event}`);
    
    setSession(session);
    
    if (session?.user) {
      // Store auth session (fire-and-forget)
      storeAuthSession(session).catch(e => 
        console.log('⚠️ Failed to store session:', e.message)
      );
      
      // Load profile WITHOUT awaiting
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (!user || user.id !== session.user.id) {
          console.log('🎯 Loading profile (async)');
          loadLeanUserProfile(session.user.id);
        } else {
          console.log('🎯 User unchanged, skipping');
        }
      }
    } else {
      // Clear user only on explicit SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        setUser(null);
        clearAuthSession().catch(e => 
          console.log('⚠️ Failed to clear session:', e.message)
        );
      }
    }
  }
);

  // ⭐ ADD THIS: Debug when user changes
  useEffect(() => {
    console.log('👤 AuthContext user changed:', {
      hasUser: !!user,
      userId: user?.id,
      username: user?.username,
      loading
    });
  }, [user, loading]);

  // ⭐ ADD THIS: Debug when session changes
  useEffect(() => {
    console.log('🔐 AuthContext session changed:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      loading
    });
  }, [session, loading]);

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

  // ✅ NEW: Refresh with social data (for profile page)
  const refreshUserWithSocial = async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id); // Use the full profile loader
    }
  };

  // ✅ NEW: Load lean profile (no social data)
  const loadLeanUserProfile = async (userId: string) => {
  if (!userId) {
    console.log('❌ loadLeanUserProfile: No userId provided');
    return;
  }
  
  console.log('👤 Loading lean profile for:', userId);
  
  // DON'T await! Make it fire-and-forget
  userService.getProfile(userId)
    .then(userProfile => {
      console.log('✅ Profile loaded successfully:', userProfile.username);
      setUser(userProfile);
    })
    .catch(error => {
      console.log('⚠️ Profile load failed (non-critical):', error.message);
      // Don't set user to null! Keep whatever state we have
      // The user is still authenticated even if profile fails
    });
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
          setLoading(false);
        }
  
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

  //  Public method for edit profile screen
  const loadLeanUserProfilePublic = async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadLeanUserProfile(session.user.id);
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
      console.log('🔑 signIn STARTING');
      try {
        const supabase = getSupabase();
        console.log('🔑 Calling supabase.auth.signInWithPassword');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
  
        if (error) {
          console.log('🔑 Sign in ERROR:', error.message);
          throw error;
        }
  
        if (data.session) {
          await storeAuthSession(data.session);
        }
  
        // if (data.user) {
        //   await loadUserProfile(data.user.id);
        // }
        console.log('🔑 Sign in SUCCESS', {
          hasSession: !!data.session,
          hasUser: !!data.user,
          userId: data.user?.id
        });

        if (data.session) {
          console.log('🔑 Storing auth session');
          await storeAuthSession(data.session);
        }

        console.log('🔑 signIn COMPLETED');
      
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
      // Clear user cache
    if (user?.id) {
      userService.clearUserCache(user.id);
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
      updateUser, // ✅ For edit profile
      refreshUserWithSocial, // ✅ For profile page (full)
      loadLeanUserProfile: loadLeanUserProfilePublic,
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