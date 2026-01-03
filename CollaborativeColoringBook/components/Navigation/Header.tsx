// components/Navigation/Header.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../shared/ThemedText';
import { Icons } from '../shared/Icon';

export type HeaderVariant = 'gallery' | 'default' | 'profile' | 'upload';

interface HeaderProps {
  variant?: HeaderVariant;
  title?: string;
  showBackButton?: boolean;
  showLogin?: boolean;
  showFilterButton?: boolean;
  showUploadButton?: boolean;
  onBackPress?: () => void;
  onFilterPress?: () => void;
  rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  variant = 'default',
  title,
  showBackButton = false,
  showLogin = false,
  showFilterButton = false,
  showUploadButton = false,
  onBackPress,
  onFilterPress,
  rightContent,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Get background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'gallery':
        return theme.colorRoles.ui.background;
      case 'profile':
        return theme.palette.brand.secondary[50]; // Light purple
      case 'upload':
        return theme.colorRoles.ui.card;
      default:
        return theme.colorRoles.ui.background;
    }
  };

  // Get title text based on variant
  const getTitle = () => {
    if (title) return title;
    switch (variant) {
      case 'gallery':
        return 'ForkArt';
      default:
        return '';
    }
  };

  // Get title color based on variant
  const getTitleColor = () => {
    switch (variant) {
      case 'gallery':
        return theme.palette.brand.secondary[900]; // Deep purple
      default:
        return theme.colorRoles.ui.text.primary;
    }
  };

  // Render left section
  const renderLeftSection = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity 
          style={styles.leftButton}
          onPress={handleBackPress}
        >
          <Icons.Back size={24} color={theme.colorRoles.ui.text.primary} />
        </TouchableOpacity>
      );
    }
    
    if (variant === 'gallery') {
      return (
        <View style={styles.logoContainer}>
          <ThemedText 
            type="title" 
            style={[styles.logoText, { color: getTitleColor() }]}
          >
            {getTitle()}
          </ThemedText>
        </View>
      );
    }
    
    return <View style={styles.leftSpacer} />;
  };

  // Render right section
  const renderRightSection = () => {
    if (rightContent) {
      return <View style={styles.rightContent}>{rightContent}</View>;
    }

    const buttons = [];
    
    if (showFilterButton && onFilterPress) {
      buttons.push(
        <TouchableOpacity
          key="filter"
          style={styles.headerButton}
          onPress={onFilterPress}
        >
          <Icons.More size={24} color={theme.colorRoles.ui.text.secondary} />
        </TouchableOpacity>
      );
    }

    if (showUploadButton) {
      buttons.push(
        <TouchableOpacity
          key="upload"
          style={styles.headerButton}
          onPress={() => navigation.navigate('Upload' as never)}
        >
          <Icons.Upload size={24} color={theme.colorRoles.art.create} />
        </TouchableOpacity>
      );
    }

    if (showLogin) {
      buttons.push(
        <TouchableOpacity
          key="login"
          style={styles.headerButton}
          onPress={() => navigation.navigate('Auth' as never)}
        >
          <ThemedText 
            type="body" 
            style={{ color: theme.colorRoles.interactive.link }}
          >
            Login
          </ThemedText>
        </TouchableOpacity>
      );
    }

    if (buttons.length === 0) {
      return <View style={styles.rightSpacer} />;
    }

    return <View style={styles.rightButtons}>{buttons}</View>;
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: getBackgroundColor(),
        borderBottomColor: theme.colorRoles.ui.border,
      }
    ]}>
      {renderLeftSection()}
      
      {/* Center title for non-gallery variants */}
      {variant !== 'gallery' && title && (
        <View style={styles.centerTitle}>
          <ThemedText type="subtitle">{title}</ThemedText>
        </View>
      )}
      
      {renderRightSection()}
    </View>
  );
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
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontWeight: '700',
  },
  leftButton: {
    padding: 4,
    marginRight: 12,
  },
  leftSpacer: {
    width: 40,
  },
  centerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerButton: {
    padding: 4,
  },
  rightSpacer: {
    width: 40,
  },
});