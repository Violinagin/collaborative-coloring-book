// components/HeaderRight.tsx - UPDATED VERSION (goes to auth when not logged in)
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const HeaderRight = () => {
  const navigation = useNavigation() as any;
  const { user } = useAuth();

  const handleUploadPress = () => {
    if (!user) {
      // Redirect to auth if not logged in
      navigation.navigate('Auth');
      return;
    }
    navigation.navigate('Upload');
  };

  const handleProfilePress = () => {
    if (!user) {
      // Redirect to auth if not logged in
      navigation.navigate('Auth');
      return;
    }
    navigation.navigate('Profile', { userId: user.id });
  };

    const handleAuthPress = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {user ? (
        // User is logged in - show upload and profile
        <>
          <TouchableOpacity 
            onPress={handleUploadPress}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 24 }}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </TouchableOpacity>
        </>
      ) : (
        // User is not logged in - show login button
        <TouchableOpacity onPress={handleAuthPress}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>
            Login
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HeaderRight;