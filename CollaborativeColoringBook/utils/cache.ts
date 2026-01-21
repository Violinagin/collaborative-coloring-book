// utils/cache.ts
import { User } from '../types/core';
import { CreativeWork } from '../types';

export type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class AppCache {
  // User cache
  private userCache = new Map<string, CacheEntry<User>>();
  
  // Artwork cache  
  private artworkCache = new Map<string, CacheEntry<CreativeWork>>();
  
  // User artworks cache (array of work IDs per user)
  private userArtworksCache = new Map<string, CacheEntry<string[]>>();
  
  // Default TTL (Time To Live) in milliseconds
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  constructor(options?: { defaultTTL?: number }) {
    if (options?.defaultTTL) {
      this.defaultTTL = options.defaultTTL;
    }
  }
  
  // ========== USER CACHE ==========
  
  getUser(userId: string): User | null {
    const entry = this.userCache.get(userId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.userCache.delete(userId);
      return null;
    }
    
    return entry.data;
  }
  
  setUser(userId: string, user: User): void {
    this.userCache.set(userId, {
      data: user,
      timestamp: Date.now()
    });
  }
  
  clearUser(userId: string): void {
    this.userCache.delete(userId);
  }
  
  clearAllUsers(): void {
    this.userCache.clear();
  }
  
  // ========== ARTWORK CACHE ==========
  
  getArtwork(workId: string): CreativeWork | null {
    const entry = this.artworkCache.get(workId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.artworkCache.delete(workId);
      return null;
    }
    
    return entry.data;
  }
  
  setArtwork(workId: string, artwork: CreativeWork): void {
    this.artworkCache.set(workId, {
      data: artwork,
      timestamp: Date.now()
    });
  }
  
  clearArtwork(workId: string): void {
    this.artworkCache.delete(workId);
  }
  
  // ========== USER ARTWORKS CACHE ==========
  
  getUserArtworks(userId: string): string[] | null {
    const entry = this.userArtworksCache.get(userId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.userArtworksCache.delete(userId);
      return null;
    }
    
    return entry.data;
  }
  
  setUserArtworks(userId: string, workIds: string[]): void {
    this.userArtworksCache.set(userId, {
      data: workIds,
      timestamp: Date.now()
    });
  }
  
  clearUserArtworks(userId: string): void {
    this.userArtworksCache.delete(userId);
  }
  
  // When an artwork is created/deleted, update user's cache
  onArtworkCreated(userId: string, workId: string): void {
    const current = this.getUserArtworks(userId) || [];
    if (!current.includes(workId)) {
      this.setUserArtworks(userId, [...current, workId]);
    }
  }
  
  onArtworkDeleted(userId: string, workId: string): void {
    const current = this.getUserArtworks(userId) || [];
    this.setUserArtworks(userId, current.filter(id => id !== workId));
  }
  
  // ========== UTILITY METHODS ==========
  
  clearAll(): void {
    this.userCache.clear();
    this.artworkCache.clear();
    this.userArtworksCache.clear();
  }
  
  getStats(): {
    users: number;
    artworks: number;
    userArtworks: number;
  } {
    return {
      users: this.userCache.size,
      artworks: this.artworkCache.size,
      userArtworks: this.userArtworksCache.size
    };
  }
  
  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean users
    for (const [key, entry] of this.userCache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.userCache.delete(key);
        cleaned++;
      }
    }
    
    // Clean artworks
    for (const [key, entry] of this.artworkCache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.artworkCache.delete(key);
        cleaned++;
      }
    }
    
    // Clean user artworks
    for (const [key, entry] of this.userArtworksCache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.userArtworksCache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Create a singleton instance
export const appCache = new AppCache();

// Optional: For development, attach to window for debugging
if (__DEV__ && typeof window !== 'undefined') {
  (window as any).appCache = appCache;
}