// components/HeaderRight.tsx - UPDATED VERSION (goes to auth when not logged in)
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface HeaderRightProps {
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  filterButtonStyle?: object;
  filterButtonEmoji?: string;
}

const HeaderRight = ({ 
  showFilterButton = false, 
  onFilterPress,
  filterButtonStyle,
  filterButtonEmoji = '🔧'
}: HeaderRightProps) => {
  const navigation = useNavigation() as any;
  const { user, session, loading } = useAuth();

  // DEBUG LOG, can remove in production)
  console.log('🔍 HeaderRight Auth State:', { 
    user: user?.username || 'null', 
    session: session ? 'exists' : 'null',
    loading 
  });


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

  const handleDefaultFilterPress = () => {
    // Default behavior: set navigation param
    navigation.setParams({ showFilterModal: true });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {/* Filter Button (conditionally shown) */}
      {showFilterButton && (
        <TouchableOpacity 
          onPress={onFilterPress || handleDefaultFilterPress}
          style={[{ marginRight: 4 }, filterButtonStyle]}
        >
          <Text style={{ fontSize: 24 }}>{filterButtonEmoji}</Text>
        </TouchableOpacity>
      )}

      {user ? (
        // User is logged in - show upload and profile
        <>
          <TouchableOpacity 
            onPress={handleUploadPress}
            style={{ marginRight: 4 }}
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