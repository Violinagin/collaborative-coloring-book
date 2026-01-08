// lib/supabase.ts - FIXED VERSION
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loggingService } from '../services/loggingService';

// SAFE environment variable access with fallbacks
const getSupabaseConfig = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔧 Supabase Config Check:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.slice(0, 20) + '...',
    keyPrefix: supabaseAnonKey?.slice(0, 10) + '...'
  });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    // Return null instead of crashing
    return null;
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

// Create a LAZY singleton - only creates client when needed
let supabaseClient: any = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    const config = getSupabaseConfig();
    
    if (!config) {
      loggingService.log('warn', 'supabase', 'init', 'Using mock client - missing config');
      // Return a mock client that won't crash the app
      console.warn('⚠️ Using mock Supabase client due to missing config');
      supabaseClient = {
        auth: {
          setSession: async () => ({ data: null, error: new Error('No config') }),
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: null }, error: null })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: new Error('Mock client') }),
              single: async () => ({ data: null, error: new Error('Mock client') })
            })
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: null, error: new Error('Mock client') })
            })
          }),
          delete: () => ({
            eq: () => ({})
          })
        }),
        storage: {
          from: () => ({
            upload: async () => ({ data: null, error: new Error('Mock client') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
            remove: async () => ({ error: null })
          })
        }
      };
    } else {
      // Create real client
      
      supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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
              .then(response => response)
              .catch(error => {
                console.error('🌐 Supabase Fetch Error:', error);
                // Don't crash on network errors
                return new Response(JSON.stringify({ error: 'Network error' }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              });
          },
        },
      });
      
      console.log('✅ Supabase client initialized successfully');
    }
    supabaseClient = loggingService.createSupabaseLogger(supabaseClient);
    
    loggingService.log('info', 'supabase', 'init', 'Client initialized successfully');
  }
  
  return supabaseClient;
};

// For backward compatibility
//export const supabase = getSupabase();