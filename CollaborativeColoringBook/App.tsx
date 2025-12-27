// TEMPORARY: Replace your entire App.tsx with this
import React from 'react';
import { View, Text, Button } from 'react-native';

export default function App() {
  const [status, setStatus] = React.useState('Starting...');
  
  React.useEffect(() => {
    // Test 1: Can we even run basic code?
    setStatus('Basic JS working...');
    
    // Test 2: Try to import and initialize Supabase
    setTimeout(async () => {
      try {
        console.log('🧪 Starting Supabase test...');
        const { getSupabase } = require('./lib/supabase');
        const supabase = getSupabase();
        setStatus('Supabase client created...');
        
        // Test 3: Try a simple auth check
        const { data, error } = await supabase.auth.getSession();
        setStatus(error ? `Error: ${error.message}` : '✅ Supabase works!');
        
      } catch (error: any) {
        setStatus(`💥 Crash: ${error?.message || 'Unknown'}`);
        console.error('Full error:', error);
      }
    }, 1000);
  }, []);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'purple' }}>
      <Text style={{ color: 'white', fontSize: 20, marginBottom: 20 }}>Diagnostic Test</Text>
      <Text style={{ color: 'white', textAlign: 'center' }}>{status}</Text>
    </View>
  );
}