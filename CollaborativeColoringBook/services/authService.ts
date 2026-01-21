// services/authService.ts - UPDATED FOR WEB SUPPORT
import { getSupabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'supabase_auth_token';
const USER_SESSION_KEY = 'supabase_user_session';

// Web-compatible storage
const getStorage = () => {
  if (Platform.OS === 'web') {
    // Web: Wrap localStorage in async functions
    return {
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error with localStorage:', error);
        }
      },
      getItem: async (key: string): Promise<string | null> => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error with localStorage:', error);
          return null;
        }
      },
      deleteItem: async (key: string): Promise<void> => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error with localStorage:', error);
        }
      }
    };
  } else {
    // Native: Use SecureStore (already async)
    return {
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('Error with SecureStore:', error);
        }
      },
      getItem: async (key: string): Promise<string | null> => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('Error with SecureStore:', error);
          return null;
        }
      },
      deleteItem: async (key: string): Promise<void> => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('Error with SecureStore:', error);
        }
      }
    };
  }
};



const storage = getStorage();
// ========== STORAGE HELPERS ==========
// Store auth session
export const storeAuthSession = async (session: any) => {
  try {
    if (session?.access_token) {
      await storage.setItem(AUTH_TOKEN_KEY, session.access_token);
    }
    if (session?.user) {
      await storage.setItem(USER_SESSION_KEY, JSON.stringify(session.user));
    }
  } catch (error) {
    console.error('❌ Error storing auth session:', error);
  }
};

// Retrieve auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await storage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error retrieving auth token:', error);
    return null;
  }
};

// Retrieve user session
export const getUserSession = async (): Promise<any | null> => {
  try {
    const userSession = await storage.getItem(USER_SESSION_KEY);
    const parsed = userSession ? JSON.parse(userSession) : null;
    return parsed;
  } catch (error) {
    console.error('❌ Error retrieving user session:', error);
    return null;
  }
};

// Clear auth data on logout
export const clearAuthSession = async () => {
  try {
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_SESSION_KEY);
  } catch (error) {
    console.error('❌ Error clearing auth session:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  const isAuth = !!token;
  return isAuth;
};

// ========== AUTH SERVICE ==========
export const authService = {
  // ✅ Update email
  async updateEmail(currentEmail: string, newEmail: string, password: string): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // First verify password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: password,
      });

      if (signInError) {
        console.error('❌ Password verification failed:', signInError);
        throw new Error('Current password is incorrect');
      }

      // Then update email
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('❌ Error updating email:', error);
      throw error;
    }
  },

  // ✅ Update password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('❌ Error updating password:', error);
      throw error;
    }
  },

  // ✅ Verify current password
  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return !error; // Returns true if no error
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      return false;
    }
  },

  // ✅ Sign out
  async signOut(): Promise<void> {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      await clearAuthSession();
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  },

  // ✅ Get current session
  async getCurrentSession() {
    const supabase = getSupabase();
    return await supabase.auth.getSession();
  },

  // ✅ Get current user
  async getCurrentUser() {
    const supabase = getSupabase();
    
    // Check if we already have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    return session.user;
  },
};

// ========== AUTH INITIALIZATION ==========
let authInitializationInProgress = false;
let lastAuthCheck = 0;
const AUTH_CHECK_COOLDOWN = 5000;

export const initializeAuth = async () => {
  
  // Prevent multiple simultaneous initializations
  if (authInitializationInProgress) {
    console.log('⏳ Auth initialization already in progress');
    return null;
  }
  
  // Rate limiting check
  const now = Date.now();
  if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
    console.log('⏳ Auth check too soon, using cache');
    return null;
  }
  
  // Prevent multiple initializations
  if (authInitializationInProgress) {
    console.log('⏳ Auth initialization already in progress');
    return null;
  }
  
  authInitializationInProgress = true;
  lastAuthCheck = now;
  
  try {
    console.log('🔄 Starting auth initialization...');
    const token = await getAuthToken();
    const userSession = await getUserSession();
    
    // Early return if no token
    if (!token || !userSession) {
      console.log('🚫 No auth data found');
      return null;
    }
    
    console.log('🔑 Found stored token and session');
    
    // Get supabase client
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      console.log('🔄 Session restoration result:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message 
      });
      
      // Return what we have
      return { 
        user: userSession, 
        token, 
        supabaseRestored: !error,
        supabaseError: error 
      };
    } catch (supabaseError) {
      console.error('⚠️ Supabase session restore failed:', supabaseError);
      return { 
        user: userSession, 
        token, 
        supabaseRestored: false,
        supabaseError 
      };
    }
  } catch (error) {
    console.error('❌ Error in initializeAuth:', error);
    return null;
  } finally {
    // This ALWAYS runs, whether try succeeds or catch catches an error
    authInitializationInProgress = false;
  };
}