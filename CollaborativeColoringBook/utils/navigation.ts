// utils/navigation.ts
import { CreativeWork } from '../types/core';

// ============ PROFILE NAVIGATION ============
export const navigateToProfile = (
    navigation: any,
    userId: string,
    currentUserId?: string
  ) => {
    console.log(`🚶 navigateToProfile: ${userId} (current: ${currentUserId})`);
    
    // If it's the current user OR no userId provided
    if (!userId || userId === currentUserId) {
      // Go to current user's profile in ProfileTab
      navigation.navigate('ProfileTab', {
        screen: 'Profile',
        params: { userId: undefined } // Explicitly undefined
      });
    } else {
      // Go to other user's profile in ArtistProfile
      navigation.navigate('ArtistProfile', { 
        userId,
        _timestamp: Date.now()
      });
    }
  };

// ============ UPLOAD NAVIGATION ============
export const navigateToUpload = (
    navigation: any, 
    user: any,
    params?: {
      originalWorkId?: string;
      originalWorkTitle?: string;
      originalWork?: CreativeWork;
    }
  ) => {
    if (!user) {
      // Not logged in - go to Auth with redirect
      navigation.navigate('Auth', {
        message: 'Sign in to upload artwork',
        redirectTo: 'Upload',
        redirectParams: params
    } as any);
      return;
    }
    
    // Logged in - navigate appropriately based on current mode
    if (navigation.canGoBack()) {
      // We're in tab mode
      navigation.navigate('UploadTab', {
        screen: 'Upload',
        params: params
      });
    } else {
      // We're in public mode (shouldn't happen if user is logged in)
      navigation.navigate('Upload', params);
    }
  };

// ============ ARTWORK DETAIL NAVIGATION ============
export const navigateToArtworkDetail = (
    navigation: any,
    workId: string,
    options?: {
      openComments?: boolean;
      autoLike?: boolean;
    }
  ) => {
    console.log(`🎨 Navigating to artwork: ${workId}`);
    
    // Navigate directly to ArtworkDetail 
    navigation.navigate('ArtworkDetail', { 
      workId,
      ...options 
    });
  };

// ============ CREATE REMIX NAVIGATION ============
export const navigateToCreateRemix = (
    navigation: any,
    user: any,
    originalWorkId: string,
    originalWorkTitle?: string
  ) => {
    if (!user) {
      // Not logged in
      navigation.navigate('Auth', {
        message: 'Sign in to create a remix',
        redirectTo: 'CreateRemix',
        redirectParams: { originalWorkId, originalWorkTitle }
      });
      return;
    }
    
    // Logged in
    navigation.navigate('CreateRemix', {
      originalWorkId,
      originalWorkTitle
    });
  };

// ============ GALLERY NAVIGATION ============
export const navigateToGallery = (
    navigation: any,
    options?: {
      showFilterModal?: boolean;
      scrollToTop?: boolean;
    }
  ) => {
    console.log('🖼️ Navigating to gallery');
    
    // Navigate to GalleryTab, then Gallery screen
    navigation.navigate('GalleryTab', {
      screen: 'Gallery',
      params: options
    });
  };

// ============ TAB SWITCHING HELPERS ============
export const switchToTab = (
  navigation: any,
  tabName: 'GalleryTab' | 'UploadTab' | 'ProfileTab'
) => {
  console.log(`🔀 Switching to tab: ${tabName}`);
  
  // Simple tab switch without navigating to specific screen
  navigation.navigate(tabName);
};

// ============ NAVIGATE TO AUTH ============
export const navigateToAuth = (navigation: any) => {
    console.log('🔐 Navigating to auth');
    navigation.navigate('Auth');
  };

// ============ DEBUG/DEVELOPMENT ============
export const navigateToDebug = (navigation: any) => {
  if (__DEV__) {
    navigation.navigate('Debug');
  }
};

export const navigateToThemePreview = (navigation: any) => {
  if (__DEV__) {
    navigation.navigate('ThemePreview');
  }
};

export const debugNavigation = (navigation: any) => {
    const state = navigation.getState();
    console.log('🔍 CURRENT NAVIGATION STATE:', {
      routeNames: state.routeNames,
      index: state.index,
      currentRoute: state.routes[state.index]?.name,
      fullState: JSON.stringify(state, null, 2)
    });
    
    // List all possible routes
    console.log('📍 POSSIBLE ROUTES FROM HERE:');
    if (state.routes[state.index]?.state) {
      const tabState = state.routes[state.index].state;
      console.log('Tab routes:', tabState?.routeNames);
    }
  };

  // ============ MODE-AWARE NAVIGATION ============

/**
 * Check if we're in tab mode
 */
export const isInTabMode = (navigation: any): boolean => {
    const state = navigation.getState();
    return state.routes[state.index]?.name === 'MainTabs';
  };
  
  /**
   * Switch to tab mode (after login)
   */
  export const switchToTabMode = (navigation: any) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };
  
  /**
   * Handle post-login navigation
   */
  export const handlePostLogin = (
    navigation: any,
    redirectTo?: string,
    redirectParams?: any
  ) => {
    if (redirectTo) {
      // Navigate to the requested screen in tab mode
      switchToTabMode(navigation);
      
      // Small delay to ensure tab mode is loaded
      setTimeout(() => {
        navigation.navigate(redirectTo, redirectParams);
      }, 100);
    } else {
      // No redirect, just go to tabs
      switchToTabMode(navigation);
    }
  };
  
  // ============ LOGOUT ============
  
  export const performLogout = async (
    navigation: any,
    signOutFunction: () => Promise<void>
  ) => {
    try {
      await signOutFunction();
      
      // Switch to public mode after logout
      navigation.reset({
        index: 0,
        routes: [{ name: 'Public' }],
      });
      
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };