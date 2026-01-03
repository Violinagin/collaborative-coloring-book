// components/Navigation/AppHeader.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../shared/ThemedText';
import { Icons } from '../shared/Icon';

interface AppHeaderProps {
  // Optional override for title
  title?: string;
  // Show back button? (auto-detected by default)
  showBackButton?: boolean;
  // Show filter button? (false by default)
  showFilterButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton,
  showFilterButton = false,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  // Determine if we should show back button
  const shouldShowBackButton = showBackButton ?? navigation.canGoBack();

  // Get screen title from route if not provided
  const screenTitle = title || getTitleFromRoute(route.name);

  // Handle back navigation
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Handle filter press (Gallery only)
  const handleFilterPress = () => {
    // This will be handled by the GalleryScreen
    navigation.setParams({ showFilterModal: true } as any);
  };

  // Handle login press
  const handleLoginPress = () => {
    navigation.navigate('Auth' as never);
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: theme.colorRoles.ui.card,
        borderBottomColor: theme.colorRoles.ui.border,
      }
    ]}>
      {/* Left Section: Back button or empty space */}
      <View style={styles.leftSection}>
        {shouldShowBackButton ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
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
        {/* Filter Button (Gallery only) */}
        {showFilterButton && (
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={handleFilterPress}
          >
            <Icons.More size={24} color={theme.colorRoles.ui.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Login / User Avatar */}
        {!user ? (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginPress}
          >
            <ThemedText 
              type="body" 
              style={{ color: theme.colorRoles.interactive.link }}
            >
              Login
            </ThemedText>
          </TouchableOpacity>
        ) : (
          // Optionally show user avatar or nothing
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  leftSpacer: {
    width: 40,
  },
  title: {
    fontWeight: '600',
  },
  filterButton: {
    padding: 4,
  },
  loginButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userSpacer: {
    width: 40,
  },
});