// components/GalleryEmptyState.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './shared/ThemedText';
import { Icons } from './shared/Icon';

interface GalleryEmptyStateProps {
  onUploadPress: () => void;
}

export const GalleryEmptyState: React.FC<GalleryEmptyStateProps> = ({ onUploadPress }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icons.Upload 
          size={64} 
          color={theme.colorRoles.ui.text.secondary}
        />
        <ThemedText type="subtitle" style={[styles.title, { color: theme.colorRoles.ui.text.primary }]}>
          No creative works yet
        </ThemedText>
        <ThemedText type="body" style={[styles.subtitle, { color: theme.colorRoles.ui.text.secondary }]}>
          Be the first to upload some art and start the creative journey!
        </ThemedText>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colorRoles.art.create }]}
          onPress={onUploadPress}
        >
          <ThemedText type="button" style={{ color: 'white' }}>
            Upload First Work
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});