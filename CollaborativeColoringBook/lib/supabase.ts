// lib/supabase.ts - UPDATED WITH API KEY FIX
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
    flowType: 'pkce',
    debug: true,
  },
  global: {
    fetch: (...args) => {
      console.log('🌐 Supabase Fetch:', {
        url: args[0],
        method: args[1]?.method,
        headers: args[1]?.headers,
      });
      
      return fetch(...args)
        .then(response => {
          console.log('🌐 Supabase Response:', {
            status: response.status,
            statusText: response.statusText,
            url: args[0],
          });
          return response;
        })
        .catch(error => {
          console.error('🌐 Supabase Fetch Error:', error);
          throw error;
        });
    },
  },
});