// hooks/useCache.ts
import React from 'react';
import { useEffect } from 'react';
import { appCache } from '../utils/cache';

export function useCache() {
  // Cleanup expired cache entries on app start
  useEffect(() => {
    const cleaned = appCache.cleanup();
    if (__DEV__ && cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }, []);
  
  return appCache;
}

// Hook for watching cache stats (development only)
export function useCacheStats(enabled: boolean = __DEV__) {
  const [stats, setStats] = React.useState(appCache.getStats());
  
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setStats(appCache.getStats());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  return stats;
}