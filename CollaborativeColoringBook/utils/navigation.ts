// utils/navigation.ts
import { CreativeWork } from '../types/core';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export const handleArtistPressNav =(
    navigation: AppNavigation,
    artistId: string,
    currentUserId?: string
  ) => {
    console.log(`🎨 WorkCard: Artist ${artistId}, Current user: ${currentUserId}`);
    
    if (artistId === currentUserId) {
      // Tapping on your own work - go to your profile tab
      navigateToCurrentUserProfile(navigation, currentUserId);
    } else {
      // Tapping on another artist's work - view their profile
      navigateToProfile(navigation, artistId, currentUserId);
    }
  };

// ============ PROFILE NAVIGATION ============

export const navigateToProfile = (
    navigation: AppNavigation,
    targetUserId: string,
    currentUserId?: string
  ) => {
    console.log(`🚶 navigateToProfile: ${targetUserId} (current: ${currentUserId})`);
    
    const isOwnProfile = currentUserId && targetUserId === currentUserId;
    
    // ALWAYS navigate to Profile screen with parameters
    navigation.navigate('Profile', {
      userId: targetUserId,
      isOtherUserProfile: !isOwnProfile
    });
  };
  
  export const navigateToCurrentUserProfile = (
    navigation: AppNavigation,
    currentUserId?: string
  ) => {
    console.log('👤 navigateToCurrentUserProfile');
    
    if (!currentUserId) {
      // Not logged in - go to auth
      navigation.navigate('Auth', {
        message: 'Sign in to view your profile',
        redirectTo: 'Profile'
      });
      return;
    }
    
    // Logged in - navigate to Profile with current user's ID
    navigation.navigate('Profile', {
      userId: currentUserId,
      isOtherUserProfile: false
    });
  };

// export const navigateToProfile = (
//     navigation: AppNavigation,
//     targetUserId: string,
//     currentUserId?: string
//   ) => {
//     console.log(`🚶 navigateToProfile: ${targetUserId} (current: ${currentUserId})`);
    
//     const isOwnProfile = currentUserId && targetUserId === currentUserId;
    
//     // Get current navigation state
//     const state = navigation.getState();
//     const currentRoute = state.routes[state.index];
//     const isInMainTabs = currentRoute.name === 'MainTabs';
    
//     if (isOwnProfile) {
//       // Viewing own profile
//       if (isInMainTabs) {
//         // Already in tabs, just switch to ProfileTab
//         navigation.navigate('Profile', {
//             userId: targetUserId,
//             isOtherUserProfile: !isOwnProfile
//           });
//       } else {
//         // In public mode, navigate to profile with auth prompt if needed
//         if (currentUserId) {
//           navigation.navigate('Profile', { 
//             userId: targetUserId,
//             isOtherUserProfile: false 
//           });
//         } else {
//           // Not logged in - go to auth first
//           navigation.navigate('Auth', {
//             message: 'Sign in to view your profile',
//             redirectTo: 'Profile',
//             redirectParams: { userId: undefined } // Will use current user after login
//           });
//         }
//       }
//     } else {
//       // Viewing another user's profile
//       if (isInMainTabs) {
//         // In tab mode, navigate within GalleryTab
//         navigation.navigate('GalleryTab', {
//           screen: 'Profile',
//           params: { 
//             userId: targetUserId,
//             isOtherUserProfile: true 
//           }
//         });
//       } else {
//         // In public mode, direct navigation
//         navigation.navigate('Profile', { 
//           userId: targetUserId,
//           isOtherUserProfile: true 
//         });
//       }
//     }
//   };

// export const navigateToProfile = (
//     navigation: NativeStackNavigationProp<RootStackParamList>,
//     userId: string,
//     currentUserId?: string
//   ) => {
//     console.log(`🚶 navigateToProfile: ${userId} (current: ${currentUserId})`);
    
//     // If it's the current user OR no userId provided
//     if (!userId || userId === currentUserId) {
//       // Go to current user's profile in ProfileTab
//       navigation.navigate('ProfileTab', {
//         screen: 'Profile',
//         params: { userId: undefined } // Explicitly undefined
//       });
//     } else {
//       // Go to other user's profile in ArtistProfile
//       navigation.navigate('ArtistProfile', { 
//         userId,
//         _timestamp: Date.now()
//       });
//     }
//   };

// ============ UPLOAD NAVIGATION ============
export const navigateToUpload = (
    navigation: AppNavigation,
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
      });
      return;
    }
    
    // Logged in - navigate to Upload
    navigation.navigate('Upload', params);
  };
// ============ ARTWORK DETAIL NAVIGATION ============
export const navigateToArtworkDetail = (
    navigation: AppNavigation,
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
    navigation: AppNavigation,
    options?: {
      showFilterModal?: boolean;
      scrollToTop?: boolean;
    }
  ) => {
    console.log('🖼️ Navigating to gallery');
    
    // Navigate to Gallery screen directly
    navigation.navigate('Gallery', options as any);
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
export const navigateToAuth = (navigation: AppNavigation) => {
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
export const isInTabMode = (navigation: AppNavigation): boolean => {
    const state = navigation.getState();
    return state.routes[state.index]?.name === 'MainTabs';
  };
  
  /**
   * Switch to tab mode (after login)
   */
  export const switchToTabMode = (navigation: AppNavigation) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };
  
  /**
   * Handle post-login navigation
   */
  export const handlePostLogin = (
    navigation: AppNavigation,
    redirectTo?: keyof RootStackParamList,
    redirectParams?: any
  ) => {
    if (redirectTo && redirectTo !== 'MainTabs') {
      // Navigate to the requested screen in tab mode
      switchToTabMode(navigation);
      
      // Small delay to ensure tab mode is loaded
      setTimeout(() => {
        navigation.navigate(redirectTo, redirectParams);
      }, 100);
    } else {
      // No redirect or redirect to MainTabs, just go to tabs
      switchToTabMode(navigation);
    }
  };
  
  // ============ LOGOUT ============
  
  export const performLogout = async (
    navigation: AppNavigation,
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