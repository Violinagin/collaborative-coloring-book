// services/authService.ts
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'supabase_auth_token';
const USER_SESSION_KEY = 'supabase_user_session';

// Store auth session securely
export const storeAuthSession = async (session: any) => {
  try {
    if (session?.access_token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.access_token);
    }
    if (session?.user) {
      await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session.user));
    }
  } catch (error) {
    console.error('Error storing auth session:', error);
  }
};

// Retrieve auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Retrieve user session
export const getUserSession = async (): Promise<any | null> => {
  try {
    const userSession = await SecureStore.getItemAsync(USER_SESSION_KEY);
    return userSession ? JSON.parse(userSession) : null;
  } catch (error) {
    console.error('Error retrieving user session:', error);
    return null;
  }
};

// Clear auth data on logout
export const clearAuthSession = async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing auth session:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Initialize auth state on app start
export const initializeAuth = async () => {
  try {
    const token = await getAuthToken();
    const userSession = await getUserSession();
    
    if (token && userSession) {
      // Restore Supabase session
      supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // You might want to store this too
      });
      
      return { user: userSession, token };
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing auth:', error);
    return null;
  }
};