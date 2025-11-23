// lib/supabase.ts - UPDATED VERSION
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Important for browsers
  },
  global: {
    headers: {
      'X-Client-Info': 'coloring-book-app',
    },
    fetch: (...args) => {
      // Use the native fetch with better error handling
      console.log('🔧 Supabase fetch called:', args[0]);
      return fetch(...args);
    },
  },
});