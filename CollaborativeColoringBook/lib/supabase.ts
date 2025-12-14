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
    debug: false,
  },
  global: {
    fetch: (...args) => {
      
      return fetch(...args)
        .then(response => {
          return response;
        })
        .catch(error => {
          console.error('🌐 Supabase Fetch Error:', error);
          throw error;
        });
    },
  },
});