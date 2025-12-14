// screens/DebugScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { storageService } from '../services/storageService';

const DebugScreen = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runStorageDebug = async () => {
    setLoading(true);
    setLogs([]);
    
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog(args.join(' '));
    };
    
    console.error = (...args) => {
      originalError.apply(console, args);
      addLog(`❌ ${args.join(' ')}`);
    };
    
    try {
      addLog('Starting storage debug...');
      await storageService.debugStorage();
      addLog('Debug completed');
    } catch (error: any) {
      addLog(`💥 Error: ${error.message}`);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={runStorageDebug}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Running Debug...' : 'Debug Storage'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Debug Logs:</Text>
      
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
      
      <Text style={styles.helpText}>
        Check browser console for detailed output
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DebugScreen;