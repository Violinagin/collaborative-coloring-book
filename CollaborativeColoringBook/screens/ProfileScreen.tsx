// screens/ProfileScreen.tsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { User, UserRole, CreativeWork } from '../types/core';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import RemoteSVG from '../components/RemoteSVG';
import { worksService } from '../services/worksService'; 
import { socialService } from '../services/socialService';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ route, navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'lineArt' | 'colorWork' | 'activity'>('lineArt');
  const { user: currentUser, signOut } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userLineArt, setUserLineArt] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [userColorWork, setUserColorWork] = useState<CreativeWork[]>([]);

  // Get the user ID from navigation params
  const { userId } = route.params;
  
  // Determine if this is the current user's own profile
  const isOwnProfile = userId === currentUser?.id;

  // Use useCallback to memoize the load function
  const loadUserProfile = useCallback(async () => {
    if (!userId) {
      console.log('Skipping profile load - no userId');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setLoadFailed(false);
      
      // Load user data
      // ✅ CHANGED: Create basic user for now (we'll build proper userService later)
      const userData: User = {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        displayName: 'User',
        avatarUrl: '👤',
        bio: 'Welcome to the coloring community!',
        roles: ['supporter'],
        joinedDate: new Date(),
        uploadedArtworks: [],
        colorizedVersions: [],
        likedArtworks: [],
      };
      setProfileUser(userData);
      
      // Load artworks
      const artworks = await worksService.getWorksWithSocialData();
      const userArtworks = artworks.filter(artwork => artwork.artistId === userId);
      setUserLineArt(userArtworks);
      // Load user's colorizations
      const userColorizations = artworks.filter(artwork => 
        artwork.artistId === userId && artwork.originalWorkId // Works that are derivatives
      );
      setUserColorWork(userColorizations);

       if (currentUser && currentUser.id !== userId) {}
      //   const followingStatus = await directSupabaseService.isFollowing(currentUser.id, userId);
      //   setIsFollowing(followingStatus);
      // }

      // const followers = await directSupabaseService.getFollowerCount(userId);
      // const following = await directSupabaseService.getFollowingCount(userId);
      // setFollowerCount(followers);
      // setFollowingCount(following);
      
    } catch (error) {
      console.error('💥 Error loading user profile:', error);
      // Only set failed if we're still supposed to be loading
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  // Load user profile data with proper cleanup
  useEffect(() => {
    if (!userId) {
      console.log('No user ID provided, redirecting to auth');
      navigation.replace('Auth');
      return;
    }

    let isMounted = true;
    const loadTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Profile load timeout - taking too long');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    loadUserProfile();

    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
    };
  }, [userId, loadUserProfile, navigation]); // Added proper dependencies

  // Handle Follow Actions
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigation.navigate('Auth');
      return;
    }
  
    if (!profileUser) return;
  
    setFollowLoading(true);
    try {
      // ✅ CHANGED: Use socialService for follow operations
      if (isFollowing) {
        // Unfollow
        await socialService.unfollowUser(currentUser.id, profileUser.id);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1)); // Optimistic update
      } else {
        // Follow
        await socialService.followUser(currentUser.id, profileUser.id);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1); // Optimistic update
      }
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
      // TODO: Revert with actual data from socialService
      // Revert optimistic update on error
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle logout
  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };
  
  const handleLogoutConfirm = async () => {

    setShowLogoutModal(false);
    try {
      await signOut();
      navigation.replace('Gallery');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      Alert.alert('Logout Failed', error?.message || 'Please try again.');
    }
  };
  
  const handleLogoutCancel = () => {
    console.log('❌ Logout cancelled by user');
    setShowLogoutModal(false);
  };

  // Show loading state
  if (loading && !loadFailed && !profileUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setLoading(false);
            setLoadFailed(true);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show error state if load failed AND we don't have any user data
  if (loadFailed && !profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Profile</Text>
        <Text style={styles.errorText}>
          There was a problem loading the user profile. This might be a network issue or the user doesn't exist.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadUserProfile}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show auth prompt if no user data and no valid userId
  if (!profileUser && !userId) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>Join the Community! 🎨</Text>
        <Text style={styles.authPromptText}>
          Sign up to create your own profile, upload line art, and start coloring with others!
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.authButtonText}>Sign Up / Login</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use profileUser for display - if we have user data, show it even if loading failed later
  const user = profileUser;

  // If we still don't have a user after loading, show error
  if (!user) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>User Not Found</Text>
        <Text style={styles.authPromptText}>
          The user profile you're looking for doesn't exist or couldn't be loaded.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Gallery</Text>
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderRoleBadges = (roles: UserRole[]) => {
    const roleLabels = {
      line_artist: '🖌️ Line Artist',
      colorist: '🎨 Colorist', 
      supporter: '❤️ Supporter'
    };

    return (
      <View style={styles.rolesContainer}>
        {roles.map(role => (
          <Text key={role} style={styles.roleBadge}>
            {roleLabels[role]}
          </Text>
        ))}
      </View>
    );
  };

  const renderHeaderActions = () => {
    if (isOwnProfile) {
      return (
        <View style={styles.ownProfileActions}>
          <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButtonSmall}
            onPress={handleLogoutPress}
          >
            <Text style={styles.logoutButtonTextSmall}>Log Out</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <TouchableOpacity 
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
            followLoading && styles.followButtonDisabled
          ]}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? "#333" : "white"} />
          ) : (
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
  };

  const renderLineArtTab = () => {
    if (userLineArt.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {isOwnProfile 
              ? "You haven't uploaded any line art yet" 
              : "No line art uploaded yet"
            }
          </Text>
          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.uploadPrompt}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={styles.uploadPromptText}>Upload Your First Artwork</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={userLineArt}
        numColumns={2}
        renderItem={({ item }: { item: CreativeWork }) => (
          <TouchableOpacity 
            style={styles.artworkItem}
            onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
          >
            <Image source={{ uri: item.assetUrl }} style={styles.artworkImage} />
          </TouchableOpacity>
        )}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.galleryGrid}
      />
    );
  };

  const renderColorWorkTab = () => {
  userColorWork.forEach((item, index) => {
    
    if (item.assetUrl) {

    } else {
      console.log('❌ NO URL FOUND');
    }
  });
  
  if (userColorWork.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {isOwnProfile 
            ? "You haven't colored any artworks yet" 
            : "No color work yet"
          }
        </Text>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.uploadPrompt}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Text style={styles.uploadPromptText}>Browse Artworks to Color</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={userColorWork}
      numColumns={2}
      renderItem={({ item }: { item: CreativeWork }) => {
  
        return (
          <TouchableOpacity 
            style={styles.artworkItem}
            onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
          >
             <RemoteSVG 
              uri={item.assetUrl}
              lineArtUrl={item.originalWorkId}
              width={150}
              height={150}
              style={styles.artworkItem}
          />
    
    <View style={styles.colorWorkBadge}>
      <Text style={styles.colorWorkBadgeText}>Colored by You</Text>
    </View>
    
    <Text style={styles.artworkTitle} numberOfLines={1}>
      {item.title.replace(' (Colored)', '')}
    </Text>
            <Text style={styles.artworkTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.originalArtist}>Original by {item.artist?.displayName || 'Unknown Artist'}</Text>
            
            {/* Debug info */}
            <Text style={styles.debugText} numberOfLines={1}>
              {item.assetUrl ? 'Has URL' : 'No URL'}
            </Text>
          </TouchableOpacity>
        );
      }}
      keyExtractor={(item: CreativeWork) => item.id}
      contentContainerStyle={styles.galleryGrid}
    />
  );
};

  const renderActivityTab = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {isOwnProfile 
          ? "Your activity feed will appear here" 
          : "Activity feed coming soon"
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: user.avatarUrl || '👤' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.username}>@{user.username}</Text>
              {isOwnProfile && <Text style={styles.youBadge}>(You)</Text>}
            </View>
            {renderHeaderActions()}
          </View>
          <Text style={styles.bio}>{user.bio || 'No bio yet.'}</Text>
          {renderRoleBadges(user.roles)}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{userLineArt.length}</Text>
          <Text style={styles.statLabel}>Artworks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.colorizedVersions?.length || 0}</Text>
          <Text style={styles.statLabel}>Colorizations</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{followerCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lineArt' && styles.activeTab]}
          onPress={() => setActiveTab('lineArt')}
        >
          <Text style={[styles.tabText, activeTab === 'lineArt' && styles.activeTabText]}>
            Line Art
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'colorWork' && styles.activeTab]}
          onPress={() => setActiveTab('colorWork')}
        >
          <Text style={[styles.tabText, activeTab === 'colorWork' && styles.activeTabText]}>
            Color Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'lineArt' && renderLineArtTab()}
        {activeTab === 'colorWork' && renderColorWorkTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </View>
    </ScrollView>
    {showLogoutModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Log Out</Text>
      <Text style={styles.modalText}>
        Are you sure you want to log out?
      </Text>
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={handleLogoutCancel}
        >
          <Text style={styles.modalCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalConfirmButton]}
          onPress={handleLogoutConfirm}
        >
          <Text style={styles.modalConfirmButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
    </View>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    margin: 20,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {  // Changed from cancelButton
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalConfirmButton: {
    backgroundColor: '#ff4444',
  },
  modalCancelButtonText: {  // Changed from cancelButtonText
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  debugButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  authPromptText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  youBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleBadge: {
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  ownProfileActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButtonSmall: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#333',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    minHeight: 200,
  },
  galleryGrid: {
    padding: 8,
  },
  artworkItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
  },
  uploadPrompt: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadPromptText: {
    color: 'white',
    fontWeight: '600',
  },
  bottomLogoutSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bottomLogoutButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomLogoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorWorkLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  debugText: {
    fontSize: 8,
    color: 'red',
    textAlign: 'center',
    marginTop: 2,
  },
  colorWorkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  colorWorkBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  artworkTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  originalArtist: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ProfileScreen;