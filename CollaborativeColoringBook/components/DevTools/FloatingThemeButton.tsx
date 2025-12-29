// components/DevTools/FloatingThemeButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const FloatingThemeButton = () => {
  const navigation = useNavigation();
  
  if (!__DEV__) return null; // Only in development
  
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('ThemePreview' as never)}
    >
      <Text style={styles.buttonText}>🎨</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
  },
});

// Add to your App.tsx:
// <FloatingThemeButton />