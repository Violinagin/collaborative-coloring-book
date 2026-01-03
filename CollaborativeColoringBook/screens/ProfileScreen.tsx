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
  RefreshControl,
} from 'react-native';
import { User, UserRole, CreativeWork } from '../types/core';
import { useAuth } from '../context/AuthContext';
import { worksService } from '../services/worksService'; 
import { userService } from '../services/userService';
import { socialService } from '../services/socialService';
import { AlertModal } from '../components/AlertModal';
import { mediaUtils } from '../utils/mediaUtils';
import MediaTypeBadge from '../components/MediaTypeBadge';
import { ProfileScreenProps } from '../types/navigation';
import { navigateToProfile, navigateToAuth, navigateToUpload, navigateToArtworkDetail, navigateToGallery } from '../utils/navigation';

type Props = ProfileScreenProps;

const ProfileScreen = ({ route, navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'originals' | 'remixes' | 'activity'>('originals');
  const { user: currentUser, signOut } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userOriginals, setUserOriginals] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [userRemixes, setUserRemixes] = useState<CreativeWork[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [refreshing, setRefreshing] = useState(false);
  

  

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  // Get the user ID from navigation params
  const params = route.params || {};
  const { userId } = params;

  // Determine if this is the current user's own profile
  const isOwnProfile = !userId || userId === currentUser?.id;

  // Use userId OR current user's ID
  const profileUserId = userId || currentUser?.id;

  

  React.useEffect(() => {
    if (profileUser) {
      navigation.setOptions({
        title: isOwnProfile ? 'My Profile' : profileUser.displayName,
      });
    } else if (userId) {
      navigation.setOptions({
        title: 'Artist Profile',
      });
    }
  }, [profileUser, isOwnProfile, userId, navigation]);
  

  // Debug logging
  useEffect(() => {
    console.log('🔍 ProfileScreen Debug:', {
      routeParams: params,
      userId,
      currentUserId: currentUser?.id,
      profileUserId,
      isOwnProfile,
      routeName: route.name // Check if it's Profile or ArtistProfile
    });
  }, [params, currentUser]);

  // Use useCallback to memoize the load function
  const loadUserProfile = useCallback(async (targetUserId: string) => {  // Take userId as parameter
    console.log('🔍 loadUserProfile called for:', targetUserId);
    
    if (!targetUserId) {
      console.log('❌ No targetUserId provided');
      return;
    }
    
    try {
      setLoading(true);
      setLoadFailed(false);
      setProfileUser(null);
      setUserOriginals([]);
      setUserRemixes([]);
      
      // 1. Load user data using userService
      console.log('📥 Loading user data...');
      const userData = await userService.getUser(targetUserId);
      setProfileUser(userData);
      
      // 2. Load ALL artworks once
      let allArtworks: CreativeWork[] = [];
      try {
        console.log('📥 Loading artworks...');
        allArtworks = await worksService.getAllWorks();
      } catch (artError) {
        console.warn('⚠️ Could not load artworks:', artError);
        allArtworks = [];
      }
      
      // 3. Filter works 
      const userOriginalWorks = allArtworks.filter(artwork => 
        artwork.artistId === targetUserId && !artwork.originalWorkId
      );
      setUserOriginals(userOriginalWorks);

      const userRemixes = allArtworks.filter(artwork => 
        artwork.artistId === targetUserId && artwork.originalWorkId
      );
      setUserRemixes(userRemixes);
      
      // 4. Load social data
      try {
        if (currentUser && currentUser.id !== targetUserId) {
          const followingStatus = await socialService.isFollowing(currentUser.id, targetUserId);
          setIsFollowing(followingStatus);
        }
        
        const [followers, following] = await Promise.all([
          socialService.getFollowerCount(targetUserId),
          socialService.getFollowingCount(targetUserId)
        ]);
        
        setFollowerCount(followers);
        setFollowingCount(following);
      } catch (socialError) {
        console.warn('⚠️ Social data failed:', socialError);
      }
      
    } catch (error) {
      console.error('💥 Critical error loading profile:', error);
      setLoadFailed(true);
      showAlert('Error', 'Failed to load user profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Remove userId dependency since we pass it as parameter

  const onRefresh = useCallback(async () => {
    if (!profileUserId) return;
    setRefreshing(true);
    await loadUserProfile(profileUserId);
    setRefreshing(false);
  }, [profileUserId, loadUserProfile]);

  // Handle missing user ID
  useEffect(() => {
    console.log('🔍 useEffect: Checking profileUserId', profileUserId);
    
    if (!profileUserId) {
      console.log('❌ No profileUserId, redirecting to Auth');
      navigation.replace('Auth');
      return;
    }
  }, [profileUserId, navigation]);

  // RESET ALL STATE WHEN PROFILE USER CHANGES
  useEffect(() => {
    console.log('🔄 Profile userId changed, resetting state');
    
    // Reset all state to defaults
    setProfileUser(null);
    setUserOriginals([]);
    setUserRemixes([]);
    setLoading(true);
    setIsFollowing(false);
    setFollowerCount(0);
    setFollowingCount(0);
    
  }, [profileUserId]);
  
  // Load user profile data
  useEffect(() => {
    console.log('🔍 useEffect: Loading profile for', profileUserId);
    
    if (!profileUserId) {
      console.log('⏸️ Skipping load - no profileUserId');
      return;
    }
    
    let isMounted = true;
    
    const loadProfile = async () => {
      console.log('🚀 Starting profile load...');
      await loadUserProfile(profileUserId);
    };
    
    loadProfile();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted && profileUserId) {
        console.log('🔄 Refocusing, reloading profile...');
        loadUserProfile(profileUserId);
      }
    });

    return () => {
      console.log('🧹 Cleanup ProfileScreen');
      isMounted = false;
      unsubscribe();
    };
  }, [profileUserId, navigation, loadUserProfile]); // Add loadUserProfile to dependencies

  // Early return if no user ID
  if (!profileUserId) {
    console.log('🔄 Showing loading - no profileUserId');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user...</Text>
      </View>
    );
  }

  if (loading && !profileUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {profileUserId === currentUser?.id 
            ? 'Loading your profile...' 
            : 'Loading profile...'
          }
        </Text>
      </View>
    );
  }

const handleArtworkPress = (workId: string) => {
  navigateToArtworkDetail(navigation, workId);
};
  
  // Handle Follow Actions
  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;
    
    if (currentUser.id === profileUser.id) return; // Can't follow yourself
    
    setFollowLoading(true);
    
    // Save current state for rollback
    const wasFollowing = isFollowing;
    const oldFollowerCount = followerCount;
    
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowerCount(wasFollowing ? oldFollowerCount - 1 : oldFollowerCount + 1);
    
    try {
      if (wasFollowing) {
        // Unfollow
        const result = await socialService.unfollowUser(currentUser.id, profileUser.id);
        
        if (!result.success) {
          // Service failed - rollback
          setIsFollowing(wasFollowing);
          setFollowerCount(oldFollowerCount);
          showAlert('Error', result.error || 'Failed to unfollow', 'error');
        }
      } else {
        // Follow
        const result = await socialService.followUser(currentUser.id, profileUser.id);
        
        if (!result.success) {
          // Service failed - rollback
          setIsFollowing(wasFollowing);
          setFollowerCount(oldFollowerCount);
          showAlert('Error', result.error || 'Failed to follow', 'error');
        }
      }
      
    } catch (error) {
      console.error('❌ Unexpected error toggling follow:', error);
      // Rollback on unexpected error
      setIsFollowing(wasFollowing);
      setFollowerCount(oldFollowerCount);
      showAlert('Error', 'An unexpected error occurred', 'error');
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
      navigation.reset({
        index: 0,
        routes: [{ name: 'Gallery' }],
      });
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      showAlert('Logout Failed', error?.message || 'Please try again.', 'error');
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
          onPress={() => navigateToProfile}
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
          Sign up to create your own profile, upload your art, and start collaborating with others!
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => navigateToAuth}
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

  const renderOriginalsTab = () => {
    if (userOriginals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {isOwnProfile 
              ? "You haven't uploaded any oringial works yet!" 
              : "No original works uploaded yet"
            }
          </Text>
          {isOwnProfile && (
            <TouchableOpacity 
              style={styles.uploadPrompt}
              onPress={() => navigateToUpload}
            >
              <Text style={styles.uploadPromptText}>Create Your First Original</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={userOriginals}
        numColumns={2}
        renderItem={({ item }: { item: CreativeWork }) => (
          <TouchableOpacity 
            style={styles.artworkItem}
            onPress={() => handleArtworkPress(item.id)}
          >
            <Image source={{ uri: item.assetUrl }} style={styles.artworkImage} />
          </TouchableOpacity>
        )}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.galleryGrid}
      />
    );
  };

  const renderRemixesTab = () => {
  
  if (userRemixes.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {isOwnProfile 
            ? "You haven't remixed any work yet" 
            : "No remixes yet"
          }
        </Text>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.uploadPrompt}
            onPress={() => navigateToGallery}
          >
            <Text style={styles.uploadPromptText}>Browse Work to Remix</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
        data={userRemixes}
        numColumns={2}
        renderItem={({ item }: { item: CreativeWork }) => {
          // Remix badge should show what type of remix it is
          const getRemixType = () => {
            // Use mediaUtils for consistent labels
            return mediaUtils.getMediaTypeLabel(item.mediaType);
          };
           const originalArtistName = item.originalWorkId 
             ? 'Unknown Artist' // We could fetch the original work to get the artist
             : 'Original Artist';
          
          return (
            <TouchableOpacity 
              style={styles.artworkItem}
              onPress={() => handleArtworkPress(item.id)}
            >
              {item.assetUrl ? (
                <Image 
                  source={{ uri: item.assetUrl }} 
                  style={styles.artworkImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}

              <View style={styles.remixBadge}>
                <MediaTypeBadge 
                  mediaType={item.mediaType}
                  size="xsmall"
                  showLabel={false}
                  variant="default"
                />
                <Text style={styles.remixBadgeText}></Text>
              </View>
              
              <Text style={styles.artworkTitle} numberOfLines={1}>
                {item.title}
              </Text>
              
              {item.originalWorkId && (
                <Text style={styles.remixInfo} numberOfLines={1}>
                  Original by {originalArtistName}
                </Text>
              )}
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
          ? "Your activity feed will show likes, comments, and follows" 
          : "Activity feed coming soon"
        }
      </Text>
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.uploadPrompt}
          onPress={() => navigateToGallery}
        >
          <Text style={styles.uploadPromptText}>Explore the community</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
    <ScrollView style={styles.scrollView}
     refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#007AFF']}
    />
    }
  >
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
          <Text style={styles.statNumber}>{userOriginals.length}</Text>
          <Text style={styles.statLabel}>Originals</Text>
        </View>
        <View style={styles.stat}>
            <Text style={styles.statNumber}>{userRemixes.length}</Text>
            <Text style={styles.statLabel}>Remixes</Text>
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
          style={[styles.tab, activeTab === 'originals' && styles.activeTab]}
          onPress={() => setActiveTab('originals')}
        >
          <Text style={[styles.tabText, activeTab === 'originals' && styles.activeTabText]}>
            Originals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'remixes' && styles.activeTab]}
          onPress={() => setActiveTab('remixes')}
        >
          <Text style={[styles.tabText, activeTab === 'remixes' && styles.activeTabText]}>
            Remixes
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
        {activeTab === 'originals' && renderOriginalsTab()}
        {activeTab === 'remixes' && renderRemixesTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </View>
    </ScrollView>

    {/* Alert Modal */}
    <AlertModal
      visible={alertVisible}
      title={alertTitle}
      message={alertMessage}
      type={alertType}
      onClose={handleAlertClose}
    />

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
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  remixBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  remixBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  remixInfo: {
    fontSize: 10,
    color: '#666',
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontStyle: 'italic',
  },
  artworkType: {
    fontSize: 10,
    color: '#666',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  artworkInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default ProfileScreen;