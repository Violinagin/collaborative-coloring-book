// navigation/RootNavigator.tsx - COMPLETE VERSION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Import all screen components
import GalleryScreen from '../screens/GalleryScreen';
import UploadScreen from '../screens/UploadScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ArtworkDetailScreen from '../screens/ArtworkDetailScreen';
import CreateRemixScreen from '../screens/CreateRemixScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import ThemePreviewScreen from '../screens/ThemePreviewScreen';

// Import navigation types
import { 
  RootStackParamList, 
  TabParamList,
} from '../types/navigation';

import { AppHeader } from '../components/Navigation/AppHeader';

// Create navigators with proper types
const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<TabParamList>();

// ============ GLOBAL HEADER CONFIG ============

// Create a custom header for all screens
const CustomStackHeader = (props: any) => {
    const route = props.route;
    
    // Determine which features to show based on route
    const getHeaderConfig = (routeName: string) => {
      switch (routeName) {
        case 'Gallery':
          return {
            showFilterButton: true,
            title: 'ForkArt',
          };
        case 'ArtworkDetail':
          return {
            showFilterButton: false,
            title: 'Artwork',
          };
        case 'Profile':
        case 'ArtistProfile':
          return {
            showFilterButton: false,
            title: 'Profile',
          };
        case 'Upload':
          return {
            showFilterButton: false,
            title: 'Upload',
          };
        case 'CreateRemix':
          return {
            showFilterButton: false,
            title: 'Create Remix',
          };
        case 'EditProfile':
          return {
            showFilterButton: false,
            title: 'Edit Profile',
          };
        default:
          return {
            showFilterButton: false,
            title: routeName,
          };
      }
    };
  
    const config = getHeaderConfig(route.name);
    
    return (
      <AppHeader
        title={config.title}
        showBackButton={props.navigation.canGoBack()}
        showFilterButton={config.showFilterButton}
      />
    );
  };

// ============ STACK NAVIGATORS (inside tabs) ============

// Gallery Stack 
function GalleryStack() {
    return (
      <RootStack.Navigator
        screenOptions={{
          header: (props) => <CustomStackHeader {...props} />,
        }}
      >
        <RootStack.Screen name="Gallery" component={GalleryScreen} />
        <RootStack.Screen name="ArtworkDetail" component={ArtworkDetailScreen} />
        <RootStack.Screen name="CreateRemix" component={CreateRemixScreen} />
        {/* Viewing OTHER users' profiles */}
        <RootStack.Screen 
          name="Profile" 
          component={ProfileScreen}
          initialParams={{ isOtherUserProfile: true }}
          options={{ title: 'Artist Profile' }}
        />
      </RootStack.Navigator>
    );
  }

  // Current User's Profile Stack - Only for the logged-in user
function CurrentUserProfileStack() {
    const { user } = useAuth();
    
    return (
      <RootStack.Navigator
        screenOptions={{
          header: (props) => <CustomStackHeader {...props} />,
        }}
      >
        {/* Current user's profile - always shows their own */}
        <RootStack.Screen 
          name="Profile" 
          component={ProfileScreen}
          initialParams={{ 
            userId: user?.id,  // Always their own ID
            isOtherUserProfile: false 
          }}
          options={{ title: 'My Profile' }}
        />
        <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
        <RootStack.Screen name="ArtworkDetail" component={ArtworkDetailScreen} />
      </RootStack.Navigator>
    );
  }
  
  
  function UploadStack() {
    return (
      <RootStack.Navigator
        screenOptions={{
          header: (props) => <CustomStackHeader {...props} />,
        }}
      >
        <RootStack.Screen name="Upload" component={UploadScreen} />
      </RootStack.Navigator>
    );
  }

// Public Stack - For logged-out users
function PublicStack() {
    return (
      <RootStack.Navigator
        screenOptions={{
          header: (props) => <CustomStackHeader {...props} />,
        }}
      >
        <RootStack.Screen name="Gallery" component={GalleryScreen} />
        <RootStack.Screen name="ArtworkDetail" component={ArtworkDetailScreen} />
        {/* Public profiles - can view anyone */}
        <RootStack.Screen 
          name="Profile" 
          component={ProfileScreen}
          initialParams={{ isOtherUserProfile: true }}
          options={{ title: 'Artist Profile' }}
        />
        <RootStack.Screen 
          name="Auth" 
          component={AuthScreen}
          initialParams={{ message: 'Welcome! Sign in to get started.' }}
        />
        {__DEV__ && (
          <RootStack.Screen name="ThemePreview" component={ThemePreviewScreen} />
        )}
      </RootStack.Navigator>
    );
  }  
  
//   function ProfileStack() {
//     return (
//       <RootStack.Navigator
//         screenOptions={{
//           header: (props) => <CustomStackHeader {...props} />,
//         }}
//       >
//         <RootStack.Screen 
//           name="Profile" 
//           component={ProfileScreen}
//           initialParams={{ userId: undefined }}
//         />
//         <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
//         <RootStack.Screen name="ArtworkDetail" component={ArtworkDetailScreen} />
//       </RootStack.Navigator>
//     );
//   }

// ============ MAIN TAB NAVIGATOR ============

function MainTabNavigator() {
  const theme = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case 'GalleryTab':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'UploadTab':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colorRoles.art.create || '#007AFF',
        tabBarInactiveTintColor: theme.colorRoles.ui.text.secondary || 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colorRoles.ui.card || '#ffffff',
          borderTopColor: theme.colorRoles.ui.border || '#e0e0e0',
          borderTopWidth: 1,
        },
      })}
    >
      <MainTab.Screen 
        name="GalleryTab" 
        component={GalleryStack}
        options={{ title: 'Gallery' }}
      />
      <MainTab.Screen 
        name="UploadTab" 
        component={UploadStack}
        options={{ title: 'Upload' }}
      />
      <MainTab.Screen 
        name="ProfileTab" 
        component={CurrentUserProfileStack}
        options={{ title: 'Profile' }}
      />
    </MainTab.Navigator>
  );
}

// // ============ PUBLIC ONLY NAVIGATOR (NEW) ============

// function PublicOnlyNavigator() {
//     return (
//         <RootStack.Navigator
//         screenOptions={{
//           header: (props) => <CustomStackHeader {...props} />,
//         }}
//       >
//         {/* Public screens only - no tabs */}
//         <RootStack.Screen name="Gallery" component={GalleryScreen} />
//         <RootStack.Screen name="ArtworkDetail" component={ArtworkDetailScreen} />
//         <RootStack.Screen 
//         name="Auth" 
//         component={AuthScreen}
//         // Pass initialParams if needed
//         initialParams={{ message: 'Welcome! Sign in to get started.' }}
//       />
//         <RootStack.Screen 
//         name="ArtistProfile" 
//         component={ProfileScreen}
//       />
//         {/* Development */}
//         {__DEV__ && (
//           <RootStack.Screen name="ThemePreview" component={ThemePreviewScreen} />
//         )}
//       </RootStack.Navigator>
//     );
//   }

// ============ ROOT NAVIGATOR (DECIDES WHICH TO SHOW) ============

function RootNavigator() {
    const { user, loading } = useAuth();
    
    if (loading) {
      return null;
    }
    
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is logged in - show the full app with tabs
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          // User is not logged in - show public-only mode (no tabs)
          <RootStack.Screen name="Public" component={PublicStack} />
        )}
        
        {/* Development screens accessible from both modes */}
        {__DEV__ && (
          <RootStack.Screen name="ThemePreview" component={ThemePreviewScreen} />
        )}
      </RootStack.Navigator>
    );
  }
  
  // ============ MAIN EXPORT ============
  
  export default function Navigation() {
    return (
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );
  }