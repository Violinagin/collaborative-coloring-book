//import './app-polyfills';

import React, {useEffect} from 'react';
import { LogBox, Platform } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

// Only load polyfills on older environments
const loadPolyfillsIfNeeded = () => {
  // Check if we're on an older Node.js or JavaScriptCore
  if (typeof Buffer === 'undefined' || typeof global === 'undefined') {
    try {
      require('./app-polyfills');
      console.log('Loaded compatibility polyfills');
    } catch (error) {
      console.log('No polyfills needed');
    }
  }
};

LogBox.ignoreAllLogs(false);

// ===== MAIN APP COMPONENT =====
export default function App() {
    useEffect(() => {
    loadPolyfillsIfNeeded();
  }, []);
  
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
          <StatusBar 
              style={Platform.OS === 'ios' ? 'light' : 'auto'} 
              backgroundColor="transparent"
              translucent={Platform.OS === 'android'}
            />
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
