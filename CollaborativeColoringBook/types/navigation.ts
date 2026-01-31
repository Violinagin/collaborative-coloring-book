// types/navigation.ts - UPDATED FOR ROOTNAVIGATOR
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CreativeWork } from './core';

export type AuthParams = {
  redirectTo?: 'Upload' | 'CreateRemix' | 'Profile' | 'Gallery';
  redirectParams?: any;
  message?: string;
};

// ============ ROOT STACK PARAMS ============
// This is the highest level navigator
export type RootStackParamList = {
  // Age gate screen (first thing users see)
  AgeGate: undefined;
  
  // Auth screen (shown when not logged in)
  Auth: AuthParams | undefined;
  Public: undefined;
  
  // Main tabs (shown when logged in)
  MainTabs: { screen?: 'GalleryTab' | 'UploadTab' | 'ProfileTab' } | undefined;
  
  // Public screens (can be accessed directly)
  Gallery: { 
    showFilterModal?: boolean;
    scrollToTop?: boolean;
    onFilterPress?: () => void;
  };
  ArtworkDetail: { 
    workId: string;
    commentModal?: boolean;
    autoLike?: boolean;
  };
  Profile: { userId?: string;
    isOtherUserProfile?: boolean;
  };
  UserProfile: { userId: string };
  
  // Protected screens (should prompt login if not authenticated)
  CreateRemix: {
    originalWorkId: string;
    originalWorkTitle?: string;
  };
  Upload: {
    originalWorkId?: string;
    originalWorkTitle?: string;
    originalWork?: CreativeWork;
  } | undefined;
  EditProfile: undefined;
  
  // Development
  ThemePreview: undefined;
  Debug: undefined;
};

// ============ TAB PARAMS ============
// Bottom tab navigator
export type TabParamList = {
  GalleryTab: undefined;
  UploadTab: undefined;
  ProfileTab: undefined;
};

// ============ SCREEN PROP TYPES (for easy use in screens) ============

export type GalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;
export type ArtworkDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ArtworkDetail'>;
export type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;
export type AgeGateScreenProps = NativeStackScreenProps<RootStackParamList, 'AgeGate'> & {
  onAgeVerified?: () => void; // ADD THIS
};
export type CreateRemixScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateRemix'>;
export type UploadScreenProps = NativeStackScreenProps<RootStackParamList, 'Upload'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
export type ThemePreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'ThemePreview'>;

// Tab screen props (if needed for tab listeners)
export type GalleryTabProps = BottomTabScreenProps<TabParamList, 'GalleryTab'>;
export type UploadTabProps = BottomTabScreenProps<TabParamList, 'UploadTab'>;
export type ProfileTabProps = BottomTabScreenProps<TabParamList, 'ProfileTab'>;

// Combined type for NavigationContainer
export type AppParamList = RootStackParamList & 
  TabParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppParamList {}
  }
}