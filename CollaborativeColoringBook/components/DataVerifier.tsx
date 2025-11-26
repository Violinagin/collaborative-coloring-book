// components/DataVerifier.tsx (temporary)
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { worksService } from '../services/worksService';
import { supabase } from '../lib/supabase';

export const DataVerifier = () => {
  const [worksCount, setWorksCount] = useState<number>(0);
  const [colorableWorks, setColorableWorks] = useState<any[]>([]);
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    verifyMigration();
  }, []);

  const verifyMigration = async () => {
    try {
      // Check works count
      const { count, error } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setWorksCount(count || 0);

      // Test the new service
      const colorable = await worksService.getColorableWorks();
      setColorableWorks(colorable);

      setStatus('success');
      console.log('✅ Migration verified! Works count:', count);
      console.log('🎨 Colorable works:', colorable.length);
    } catch (error) {
      console.error('❌ Verification failed:', error);
      setStatus('error');
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: status === 'success' ? '#d4edda' : '#f8d7da' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
        Migration Verification: {status.toUpperCase()}
      </Text>
      <Text>Total Works: {worksCount}</Text>
      <Text>Colorable Works: {colorableWorks.length}</Text>
      {colorableWorks.slice(0, 3).map(work => (
        <Text key={work.id} style={{ fontSize: 12 }}>
          • {work.title} ({work.mediaType})
        </Text>
      ))}
    </View>
  );
};