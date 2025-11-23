// Replace your App.tsx with this test version
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { directSupabaseService } from './services/directSupabaseService';

export default function App() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  useEffect(() => {
    const testDirectService = async () => {
      addResult('🧪 Testing Direct Supabase Service...');
      
      try {
        addResult('📡 Testing getUser with direct service...');
        const user = await directSupabaseService.getUser('b4b73556-d8cf-4c70-a740-c2758cfa19ce');
        addResult(`✅ Direct service success! User: ${user.displayName} (@${user.username})`);
        
        addResult('📡 Testing getArtworks with direct service...');
        const artworks = await directSupabaseService.getArtworks();
        addResult(`✅ Artworks loaded: ${artworks.length} total`);
        
      } catch (error) {
        addResult(`❌ Direct service failed: ${error}`);
      }
    };

    testDirectService();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Direct Service Test</Text>
      {testResults.map((result, index) => (
        <Text key={index} style={{ marginBottom: 5, fontFamily: 'monospace' }}>
          {result}
        </Text>
      ))}
    </View>
  );
}