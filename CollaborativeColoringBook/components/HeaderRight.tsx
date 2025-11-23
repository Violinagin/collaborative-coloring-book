// components/HeaderRight.tsx - UPDATED VERSION (goes to auth when not logged in)
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const HeaderRight = () => {
  const navigation = useNavigation() as any;
  const { user } = useAuth();

  console.log('🔍 HeaderRight - User object:', user);
  console.log('🔍 HeaderRight - User ID:', user?.id);

  const handleUploadPress = () => {
    console.log('🎯 Profile button clicked');
    console.log('🎯 Current user ID:', user?.id);
    if (!user) {
      // Go to auth screen when not logged in
      console.log('🚫 No user, navigating to Auth');
      navigation.navigate('Auth');
      return;
    }
    console.log('✅ Navigating to Profile with ID:', user.id);
    navigation.navigate('Upload');
  };

  const handleProfilePress = () => {
    if (!user) {
      // Go directly to auth screen when not logged in
      navigation.navigate('Auth');
      return;
    }
    console.log('Navigating to profile with user ID:', user.id);
    navigation.navigate('Profile', { userId: user.id });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity 
        onPress={handleUploadPress}
        style={{ marginRight: 16 }}
      >
        <Text style={{ fontSize: 24 }}>📤</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleProfilePress}>
        <Text style={{ fontSize: 24 }}>👤</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderRight;