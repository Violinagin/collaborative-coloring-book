import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../shared/ThemedText';
import { Icons } from '../shared/Icon';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  navigation?: any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton,
  showFilterButton = false,
  onFilterPress,
}:AppHeaderProps) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Determine if we should show back button
  const shouldShowBackButton = showBackButton ?? navigation.canGoBack();

  // Get screen title from route if not provided
  const screenTitle = title || getTitleFromRoute(route.name);

  // Calculate iOS-safe padding
  const headerPaddingTop = Platform.select({
    ios: Math.max(16, insets.top),
    android: 16,
    default: 16,
  });

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleFilterPress = () => {
    
    // Option 1: Use callback if provided
    if (onFilterPress) {
      onFilterPress();
      return;
    }
    
    // Option 2: Fall back to route params
    if (navigation) {
      navigation.setParams({ showFilterModal: true });
    } else {
      console.warn('⚠️ No filter handler available');
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Auth' as never);
  };

  // Dynamic styles that depend on props/state
  const dynamicStyles = {
    container: {
      backgroundColor: theme.colorRoles.ui.header,
      borderBottomColor: theme.colorRoles.ui.border,
      paddingTop: headerPaddingTop,
    },
    loginText: {
      color: theme.colorRoles.interactive.link,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Left Section: Back button or empty space */}
      <View style={styles.leftSection}>
        {shouldShowBackButton ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={HIT_SLOP}
          >
            <Icons.Back size={24} color={theme.colorRoles.ui.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.leftSpacer} />
        )}
      </View>

      {/* Center Section: Screen Title */}
      <View style={styles.centerSection}>
        <ThemedText type="subtitle" style={styles.title}>
          {screenTitle}
        </ThemedText>
      </View>

      {/* Right Section: Filter/Login/User */}
      <View style={styles.rightSection}>
        {/* Filter button - shows for everyone on Gallery screen */}
        {showFilterButton && (
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={handleFilterPress}
            hitSlop={HIT_SLOP}
          >
            <Icons.More size={24} color={theme.colorRoles.ui.text.secondary} />
          </TouchableOpacity>
        )}
        
        {/* Login button - shows only when NOT logged in */}
        {!user && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginPress}
            hitSlop={HIT_SLOP}
          >
            <ThemedText 
              type="body" 
              style={[styles.loginButtonText, dynamicStyles.loginText]}
              numberOfLines={1}
            >
              Login
            </ThemedText>
          </TouchableOpacity>
        )}
        
        {/* Empty spacer when logged in AND no filter button needed */}
        {user && !showFilterButton && (
          <View style={styles.userSpacer} />
        )}
      </View>
    </View>
  );
};

// Helper to get screen title from route name
const getTitleFromRoute = (routeName: string): string => {
  const titleMap: Record<string, string> = {
    'Gallery': 'ForkArt',
    'Profile': 'Profile',
    'ArtistProfile': 'Profile',
    'ArtworkDetail': 'Artwork',
    'Upload': 'Upload',
    'CreateRemix': 'Create Remix',
    'EditProfile': 'Edit Profile',
    'ThemePreview': 'Theme Reference',
  };
  return titleMap[routeName] || routeName;
};

// Reusable constants
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// Static styles - everything that doesn't change
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    minHeight: Platform.select({
      ios: 44,
      android: 56,
      default: 56,
    }),
  },
  leftSection: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 88, // Fixed width for right section
  },
  backButton: {
    padding: 8,
  },
  leftSpacer: {
    width: 44,
  },
  title: {
    fontWeight: '600',
    fontSize: 30,
    textAlign: 'center',
    paddingTop: 10,
    color: '#fff',
  },
  filterButton: {
    padding: 8,
    marginRight: 8, // Space between filter and login
  },
  loginButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userSpacer: {
    width: 44,
  },
});