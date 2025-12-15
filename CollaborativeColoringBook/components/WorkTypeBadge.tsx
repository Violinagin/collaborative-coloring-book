// src/components/WorkTypeBadge.tsx
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface WorkTypeBadgeProps {
  isOriginal: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const WorkTypeBadge: React.FC<WorkTypeBadgeProps> = ({ 
  isOriginal, 
  size = 'medium' 
}) => {
  const sizeStyles = {
    small: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2 },
    medium: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4 },
    large: { fontSize: 14, paddingHorizontal: 10, paddingVertical: 6 },
  };

  const currentSize = sizeStyles[size];

  if (isOriginal) {
    return (
      <View style={[
        styles.container,
        styles.originalContainer,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        }
      ]}>
        <Text style={[
          styles.text,
          styles.originalText,
          { fontSize: currentSize.fontSize }
        ]}>
          ✨ Original
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      styles.remixContainer,
      {
        paddingHorizontal: currentSize.paddingHorizontal,
        paddingVertical: currentSize.paddingVertical,
      }
    ]}>
      <Text style={[
        styles.text,
        styles.remixText,
        { fontSize: currentSize.fontSize }
      ]}>
        🔄 Remix
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  originalContainer: {
    backgroundColor: '#fef3c7',
  },
  remixContainer: {
    backgroundColor: '#f5f3ff',
  },
  text: {
    fontWeight: '600',
  },
  originalText: {
    color: '#f59e0b',
  },
  remixText: {
    color: '#7c3aed',
  },
});

export default WorkTypeBadge;