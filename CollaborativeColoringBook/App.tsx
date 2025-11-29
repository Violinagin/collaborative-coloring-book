import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GalleryScreen from './screens/GalleryScreen';
import ArtworkDetailScreen from './screens/ArtworkDetailScreen';
import { RootStackParamList } from './types/navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProfileScreen from './screens/ProfileScreen';
//import ColoringScreen from './screens/ColoringScreen';
import UploadScreen from './screens/UploadScreen';
import AuthScreen from './screens/AuthScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import HeaderRight from './components/HeaderRight';
import { View, Text } from 'react-native';
import SkiaColoringScreen from './screens/SkiaColoringScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { Skia } from '@shopify/react-native-skia';


// Create the navigator with your specific types
const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Gallery is always accessible to everyone */}
        <Stack.Screen 
          name="Gallery" 
          component={GalleryScreen}
          options={({ navigation }) => ({ 
            title: 'Collaborative Coloring Book',
            headerRight: () => <HeaderRight />
          })}
        />
        
        {/* Artwork details are public */}
        <Stack.Screen 
          name="ArtworkDetail" 
          component={ArtworkDetailScreen}
          options={{ title: 'Artwork Details' }}
        />

        {user ? (
          // User is signed in - show protected screens
          <>
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
              options={{ title: 'Upload Line Art' }}
            />
            <Stack.Screen 
              name="SkiaColoring" 
              component={SkiaColoringScreen}
              options={{ title: 'Color This Artwork' }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
          </>
        ) : (
          // User is not signed in - show auth screen
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ErrorBoundary>
  );
}