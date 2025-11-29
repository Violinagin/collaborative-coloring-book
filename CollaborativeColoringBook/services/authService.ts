// services/authService.ts - UPDATED FOR WEB SUPPORT
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'supabase_auth_token';
const USER_SESSION_KEY = 'supabase_user_session';

// Web-compatible storage
const getStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error with localStorage:', error);
        }
      },
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error with localStorage:', error);
          return null;
        }
      },
      deleteItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error with localStorage:', error);
        }
      }
    };
  } else {
    // Use SecureStore for native
    return {
      setItem: async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('Error with SecureStore:', error);
        }
      },
      getItem: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('Error with SecureStore:', error);
          return null;
        }
      },
      deleteItem: async (key: string) => {
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

// Store auth session
export const storeAuthSession = async (session: any) => {
  try {
    console.log('💾 Storing auth session for platform:', Platform.OS);
    if (session?.access_token) {
      await storage.setItem(AUTH_TOKEN_KEY, session.access_token);
    }
    if (session?.user) {
      await storage.setItem(USER_SESSION_KEY, JSON.stringify(session.user));
    }
    console.log('✅ Auth session stored successfully');
  } catch (error) {
    console.error('❌ Error storing auth session:', error);
  }
};

// Retrieve auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await storage.getItem(AUTH_TOKEN_KEY);
    console.log('💾 Retrieved auth token:', !!token);
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
    console.log('💾 Retrieved user session:', !!parsed);
    return parsed;
  } catch (error) {
    console.error('❌ Error retrieving user session:', error);
    return null;
  }
};

// Clear auth data on logout
export const clearAuthSession = async () => {
  try {
    console.log('🗑️ Clearing auth session');
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_SESSION_KEY);
    console.log('✅ Auth session cleared');
  } catch (error) {
    console.error('❌ Error clearing auth session:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  const isAuth = !!token;
  console.log('🔐 Authentication check:', isAuth);
  return isAuth;
};

// Initialize auth state on app start
export const initializeAuth = async () => {
  try {
    console.log('🚀 Initializing auth for platform:', Platform.OS);
    const token = await getAuthToken();
    const userSession = await getUserSession();
    
    console.log('🚀 Auth initialization results:', { 
      hasToken: !!token, 
      hasUser: !!userSession 
    });
    
    if (token && userSession) {
      console.log('🔄 Restoring Supabase session');
      // Restore Supabase session
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // You might want to store refresh token too
      });
      
      console.log('🔄 Session restoration result:', { data, error });
      
      return { user: userSession, token };
    }
    
    console.log('🚀 No stored session found');
    return null;
  } catch (error) {
    console.error('❌ Error initializing auth:', error);
    return null;
  }
};