// components/DevTools/FloatingThemeButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FloatingThemeButton = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  // Only show in development
  if (!__DEV__) return null;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: theme.colorRoles.social.remix,
          shadowColor: theme.palette.neutral[900],
          shadowOffset: theme.shadows.md.shadowOffset,
          shadowOpacity: theme.shadows.md.shadowOpacity,
          shadowRadius: theme.shadows.md.shadowRadius,
          elevation: theme.shadows.md.elevation,
        }
      ]}
      onPress={() => navigation.navigate('ThemePreview')}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>🎨</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100, // Above the bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
  },
});