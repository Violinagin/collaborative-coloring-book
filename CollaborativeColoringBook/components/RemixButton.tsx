// components/RemixButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface RemixButtonProps {
  workId: string;
  workTitle: string;
  style?: any;
}

export const RemixButton: React.FC<RemixButtonProps> = ({ 
  workId, 
  workTitle,
  style,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const handlePress = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to create remixes',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => navigation.navigate('Auth')}
        ]
      );
      return;
    }

    navigation.navigate('CreateRemix', { 
        originalWorkId: workId,
        originalWorkTitle: workTitle
      });
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>🎨 Create Remix</Text>
      <Text style={styles.subText}>Build upon this work</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
});