// lib/supabase.ts - UPDATED WITH API KEY FIX
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey, // Add this line
      'X-Client-Info': 'coloring-book-app',
    },
    fetch: (...args) => {
      console.log('🌐 Supabase Fetch:', {
        url: args[0],
        method: args[1]?.method,
      });
      
      // Ensure the API key is included
      const options = {
        ...args[1],
        headers: {
          ...args[1]?.headers,
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`, // Also try this
        },
      };
      
      return fetch(args[0], options)
        .then(response => {
          console.log('🌐 Supabase Response:', {
            status: response.status,
            statusText: response.statusText,
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