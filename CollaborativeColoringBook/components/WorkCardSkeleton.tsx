// components/WorkCard/WorkCardSkeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export const WorkCardSkeleton: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.imageSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
      <View style={styles.actionsSkeleton}>
        <View style={[styles.buttonSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
        <View style={[styles.buttonSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
        <View style={[styles.buttonSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
      </View>
      <View style={styles.textSkeleton}>
        <View style={[styles.titleSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
        <View style={[styles.artistSkeleton, { backgroundColor: theme.palette.neutral[200] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageSkeleton: {
    width: '100%',
    height: width,
  },
  actionsSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  buttonSkeleton: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  textSkeleton: {
    padding: 16,
  },
  titleSkeleton: {
    width: '70%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  artistSkeleton: {
    width: '40%',
    height: 16,
    borderRadius: 4,
  },
});