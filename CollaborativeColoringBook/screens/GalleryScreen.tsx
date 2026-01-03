import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
  
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { worksService } from '../services/worksService';
import { socialService } from '../services/socialService';
import { CreativeWork, MediaType } from '../types/core';
import { mediaUtils } from '../utils/mediaUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HeartButton } from '../components/shared/HeartButton';
import { ThemedText } from '../components/shared/ThemedText';
import { Icons } from '../components/shared/Icon';
import { navigateToProfile, navigateToAuth, navigateToUpload } from '../utils/navigation';
import { WorkCard } from '../components/shared/WorkCard';
import { WorkCardSkeleton } from '../components/WorkCardSkeleton';
import { GalleryEmptyState } from '../components/GalleryEmptyState';
import { GalleryScreenProps } from '../types/navigation';


const { width } = Dimensions.get('window');

type Props = GalleryScreenProps;

// All available media types
const ALL_MEDIA_TYPES: MediaType[] = [
  'line_art', 'colored_art', 'digital_art', 
  'writing', 'music', 'animation', 'comic', 'three_d'
];

const GalleryScreen = ({ navigation, route }: Props) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  // State
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<CreativeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likeData, setLikeData] = useState<{[workId: string]: {count: number, isLiked: boolean}}>({});
  const [commentData, setCommentData] = useState<{[workId: string]: number}>({});
  
  // Filtering state
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<MediaType[]>(ALL_MEDIA_TYPES);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  
  // Debug handler
  const handleUploadPress = useCallback(() => {
    console.log('Upload FAB pressed');
    
    if (!user) {
      navigateToAuth;
      return;
    }
    
    // Use type assertion to bypass TypeScript
    try {
      (navigation as any).navigate('UploadTab');
      console.log('✅ Navigated to UploadTab');
    } catch (error) {
      console.error('Failed to navigate:', error);
      
      // Fallback to Upload screen
      try {
        navigateToUpload;
        console.log('✅ Fallback: Navigated to Upload screen');
      } catch (error2) {
        console.error('All navigation failed:', error2);
      }
    }
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      const params = route.params as { showFilterModal?: boolean };
      if (params?.showFilterModal) {
        setShowFilterModal(true);
        // Clear the param after showing modal
        navigation.setParams({ showFilterModal: undefined });
      }
    }, [route.params, navigation])
  );

  // Load works on focus
  useEffect(() => {
    if (isFocused) {
      loadWorks();
    }
  }, [isFocused, user]);

  const loadWorks = async () => {
    try {
      setLoading(true);
      const allWorks = await worksService.getAllWorks();
      setWorks(allWorks);
      applyFilters(allWorks, selectedMediaTypes, sortBy);
      await loadSocialData(allWorks);
    } catch (error) {
      console.error('Error loading works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSocialData = async (worksToLoad: CreativeWork[]) => {
    const likeData: {[workId: string]: {count: number, isLiked: boolean}} = {};
    const commentData: {[workId: string]: number} = {};
      
    const dataPromises = worksToLoad.map(async (work) => {
      const [likeCount, workComments, isLiked] = await Promise.all([
        socialService.getLikeCount(work.id),        
        socialService.getComments(work.id),         
        user ? socialService.isLiked(work.id, user.id) : false
      ]);
        
      return { 
        workId: work.id, 
        likeCount, 
        commentCount: workComments.length,
        isLiked 
      };
    });
      
    const results = await Promise.all(dataPromises);
      
    results.forEach(result => {
      likeData[result.workId] = {
        count: result.likeCount,
        isLiked: result.isLiked
      };
      commentData[result.workId] = result.commentCount;
    });
      
    setLikeData(likeData);
    setCommentData(commentData);
  };

  const applyFilters = (worksList: CreativeWork[], mediaTypes: MediaType[], sortMethod: string) => {
    let filtered = worksList;
    
    if (mediaTypes.length < ALL_MEDIA_TYPES.length) {
      filtered = filtered.filter(work => mediaTypes.includes(work.mediaType));
    }
    
    switch (sortMethod) {
      case 'recent':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
        
      case 'popular':
        filtered = [...filtered].sort((a, b) => {
          const likesA = likeData[a.id]?.count || 0;
          const likesB = likeData[b.id]?.count || 0;
          return likesB - likesA;
        });
        break;
        
      case 'trending':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    setFilteredWorks(filtered);
  };

  // Filter functions
  const toggleMediaType = (type: MediaType) => {
    const newTypes = selectedMediaTypes.includes(type)
      ? selectedMediaTypes.filter(t => t !== type)
      : [...selectedMediaTypes, type];
    
    setSelectedMediaTypes(newTypes);
    applyFilters(works, newTypes, sortBy);
  };

  const selectAllMediaTypes = () => {
    setSelectedMediaTypes(ALL_MEDIA_TYPES);
    applyFilters(works, ALL_MEDIA_TYPES, sortBy);
  };

  const clearMediaTypes = () => {
    setSelectedMediaTypes([]);
    applyFilters(works, [], sortBy);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  const handleLike = async (workId: string) => {
    if (!user) {
      navigateToAuth;
      return;
    }
    
    const currentLikeState = likeData[workId]?.isLiked || false;
    const currentCount = likeData[workId]?.count || 0;
    
    // Optimistic update
    setLikeData(prev => ({
      ...prev,
      [workId]: {
        count: currentLikeState ? currentCount - 1 : currentCount + 1,
        isLiked: !currentLikeState
      }
    }));
  
    try {
      const nowLiked = await socialService.toggleLike(workId, user.id);
      const newLikeCount = await socialService.getLikeCount(workId);
      
      // Sync with server
      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: newLikeCount,
          isLiked: nowLiked
        }
      }));
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback
      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: currentCount,
          isLiked: currentLikeState
        }
      }));
    }
  };

  // RENDER FUNCTIONS

  const renderWorkItem = ({ item }: { item: CreativeWork }) => {
    const likeInfo = likeData[item.id] || { count: 0, isLiked: false };
    const commentCount = commentData[item.id] || 0;
    
    return (
      <WorkCard
        work={{
          id: item.id,
          title: item.title,
          assetUrl: item.assetUrl,
          artistId: item.artistId,
          artist: {
            displayName: item.artist?.displayName || 'Unknown Artist',
            username: item.artist?.username,
          },
          mediaType: item.mediaType,
          originalWorkId: item.originalWorkId,
          description: item.description,
          aspectRatio: item.aspectRatio,
        }}
        likeInfo={likeInfo}
        commentCount={commentCount}
        onLikePress={() => handleLike(item.id)}
      />
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colorRoles.ui.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Filter Works</ThemedText>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icons.Close size={24} color={theme.colorRoles.ui.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterSection}>
            <ThemedText type="body" style={styles.filterTitle}>Media Types</ThemedText>
            <View style={styles.filterActions}>
              <TouchableOpacity onPress={selectAllMediaTypes}>
                <ThemedText type="caption" style={{ color: theme.colorRoles.social.like }}>
                  Select All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearMediaTypes}>
                <ThemedText type="caption" style={{ color: theme.palette.semantic.error[500] }}>
                  Clear All
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaTypeGrid}>
              {ALL_MEDIA_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mediaTypeFilter,
                    { backgroundColor: selectedMediaTypes.includes(type) 
                      ? theme.colorRoles.social.like 
                      : theme.palette.neutral[100]
                    }
                  ]}
                  onPress={() => toggleMediaType(type)}
                >
                  <ThemedText type="caption" style={[
                    styles.mediaTypeFilterText,
                    { color: selectedMediaTypes.includes(type) 
                      ? theme.colorRoles.ui.text.inverse 
                      : theme.colorRoles.ui.text.secondary
                    }
                  ]}>
                    {mediaUtils.getMediaTypeLabel(type)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <ThemedText type="body" style={styles.filterTitle}>Sort By</ThemedText>
            <View style={styles.sortOptions}>
              {(['recent', 'popular', 'trending'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    { backgroundColor: sortBy === option 
                      ? theme.colorRoles.social.remix 
                      : theme.palette.neutral[100]
                    }
                  ]}
                  onPress={() => setSortBy(option)}
                >
                  <ThemedText type="body" style={[
                    styles.sortOptionText,
                    { color: sortBy === option 
                      ? theme.colorRoles.ui.text.inverse 
                      : theme.colorRoles.ui.text.secondary
                    }
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: theme.colorRoles.social.remix }]}
            onPress={() => setShowFilterModal(false)}
          >
            <ThemedText type="button" style={{ color: theme.colorRoles.ui.text.inverse }}>
              Apply Filters
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading state
if (loading && works.length === 0) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colorRoles.ui.background }]}>
      <FlatList
        data={[1, 2, 3]} // Show 3 skeleton cards
        renderItem={() => <WorkCardSkeleton />}
        contentContainerStyle={styles.galleryList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colorRoles.ui.background }]}>
      
      {/* Active filters summary */}
      <View style={styles.activeFilters}>
        <ThemedText type="caption">
          Showing {filteredWorks.length} of {works.length} works
          {selectedMediaTypes.length < ALL_MEDIA_TYPES.length && 
            ` • ${selectedMediaTypes.length} media types`
          }
        </ThemedText>
      </View>
      
      {/* Gallery List */}
      <FlatList
        data={filteredWorks}
        renderItem={renderWorkItem}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.galleryList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colorRoles.art.create}
          />
        }
        ListEmptyComponent={
          <GalleryEmptyState 
            onUploadPress={() => navigateToUpload}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      
      {/* Filter Modal */}
      {renderFilterModal()}
      
      {/* Upload FAB */}
      <TouchableOpacity 
        style={[styles.uploadFab, { backgroundColor: theme.colorRoles.art.create }]}
        onPress={handleUploadPress}
        activeOpacity={0.8}
      >
        <Icons.Upload size={28} color={theme.colorRoles.ui.text.inverse} />
      </TouchableOpacity>
      
    </SafeAreaView>
  );
};

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    color: '#581c87', // Your deep purple
  },
  filterButton: {
    padding: 8,
  },
  activeFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  galleryList: {
    paddingHorizontal: 12,
    paddingBottom: 80, // Space for bottom nav
  },
  workCard: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  workImage: {
    width: '100%',
    height: width, // Square aspect ratio
    backgroundColor: '#f3f4f6',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    marginLeft: 4,
  },
  metadata: {
    padding: 16,
  },
  workTitle: {
    marginBottom: 4,
  },
  artistName: {
    color: '#3b82f6', // Your blue for interactive text
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterSection: {
    padding: 20,
  },
  filterTitle: {
    marginBottom: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mediaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  mediaTypeFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaTypeFilterText: {
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOptionText: {
    fontWeight: '500',
  },
  applyButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadFab: {
    position: 'absolute',
    bottom: 90, // Above the bottom nav
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default GalleryScreen;
