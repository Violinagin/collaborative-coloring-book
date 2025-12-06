import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { worksService } from '../services/worksService';
import { socialService } from '../services/socialService';
import { CreativeWork, MediaType } from '../types/core';
import { mediaUtils } from '../utils/mediaUtils';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

// All available media types
const ALL_MEDIA_TYPES: MediaType[] = [
  'line_art', 'colored_art', 'digital_art', 
  'writing', 'music', 'animation', 'comic', 'three_d'
];

const GalleryScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isFocused = useIsFocused();
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

  const loadWorks = async () => {
    console.log('🚀 === loadWorks START ===', Date.now());
    try {
      setLoading(true);
      
      // Get ALL works (not just colorable)
      const allWorks = await worksService.getAllWorks();
      console.log('📊 Loaded', allWorks.length, 'works total');
      
      setWorks(allWorks);
      applyFilters(allWorks, selectedMediaTypes, sortBy);
      
      // Load social data
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
        user ? socialService.isLiked(work.id) : false
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
      
      // Filter by media type
      if (mediaTypes.length < ALL_MEDIA_TYPES.length) {
        filtered = filtered.filter(work => 
          mediaTypes.includes(work.mediaType)
        );
      }
      
      // Sort
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
          // Could be based on recent likes/comments
          // For now, same as recent
          filtered = [...filtered].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }
      
      setFilteredWorks(filtered);
    };
  
    // Toggle media type filter
    const toggleMediaType = (type: MediaType) => {
      const newTypes = selectedMediaTypes.includes(type)
        ? selectedMediaTypes.filter(t => t !== type)
        : [...selectedMediaTypes, type];
      
      setSelectedMediaTypes(newTypes);
      applyFilters(works, newTypes, sortBy);
    };
  
    // Select all media types
    const selectAllMediaTypes = () => {
      setSelectedMediaTypes(ALL_MEDIA_TYPES);
      applyFilters(works, ALL_MEDIA_TYPES, sortBy);
    };
  
    // Clear all media types (then user can select specific ones)
    const clearMediaTypes = () => {
      setSelectedMediaTypes([]);
      applyFilters(works, [], sortBy);
    };
  
    useEffect(() => {
      if (isFocused) {
        loadWorks();
      }
    }, [isFocused, user]);

    useEffect(() => {
      // Reapply filters when sort changes
      applyFilters(works, selectedMediaTypes, sortBy);
    }, [sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  // Handle like - redirect to auth if not logged in
  const handleLike = async (workId: string) => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    try {
      // Optimistic update
      const currentLikeState = likeData[workId]?.isLiked || false;
      const currentCount = likeData[workId]?.count || 0;

      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: currentLikeState ? currentCount - 1 : currentCount + 1,
          isLiked: !currentLikeState
        }
      }));

    const nowLiked = await socialService.toggleLike(workId, user.id);
    const newLikeCount = await socialService.getLikeCount(workId);
      
      // Update with actual database state
      setLikeData(prev => ({
        ...prev,
        [workId]: {
          count: newLikeCount,
          isLiked: nowLiked
        }
      }));
      
    } catch (error) {
      console.error('Error toggling like:', error);
      loadWorks(); // Reload to get correct state
    }
  };

  const renderWorkItem = ({ item }: { item: CreativeWork }) => {
    const likeInfo = likeData[item.id] || { count: 0, isLiked: false };
    const commentCount = commentData[item.id] || 0;
    
    return (
      <TouchableOpacity 
        style={styles.workCard}
        onPress={() => navigation.navigate('ArtworkDetail', { 
          work: item, })}
      >
        <Image 
          source={{ uri: item.assetUrl }} 
          style={styles.workImage}
          resizeMode="contain"
        />
        <View style={styles.workInfo}>
          <Text style={styles.title}>{item.title}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: item.artistId })}
          >
            <Text style={styles.artist}>by User {item.artistId.slice(0, 8)}</Text>
          </TouchableOpacity>
          
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          {/* Media Type Badge */}
          <View style={styles.workMeta}>
            <Text style={[
              styles.mediaTypeBadge,
              { backgroundColor: mediaUtils.getMediaTypeColor(item.mediaType) }
            ]}>
              {mediaUtils.getMediaTypeLabel(item.mediaType)}
            </Text>
            
            {mediaUtils.isColorable(item) && (
              <Text style={styles.colorableBadge}>🎨 Colorable</Text>
            )}
            
            {/* Remix Chain Indicator */}
            {item.originalWorkId && (
              <Text style={styles.remixBadge}>🔄 Remix</Text>
            )}
          </View>
          
          {/* Social Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, likeInfo.isLiked && styles.likedButton]}
              onPress={() => {
                handleLike(item.id);
              }}
            >
              <Text style={styles.actionText}>
                {likeInfo.isLiked ? '❤️' : '🤍'} {likeInfo.count}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ArtworkDetail', { 
                work: item, 
               })}
            >
              <Text style={styles.actionText}>💬 {commentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.remixButton}
              onPress={() => navigation.navigate('CreateRemix', { 
                originalWorkId: item.id,
                originalWorkTitle: item.title
              })}
            >
              <Text style={styles.remixButtonText}>🎵 Remix</Text>
            </TouchableOpacity>
            
            {/* {mediaUtils.isColorable(item) && (
              <TouchableOpacity 
                style={styles.colorButton}
                onPress={() => navigation.navigate('SkiaColoring', { work: item })}
              >
                <Text style={styles.colorButtonText}>🎨 Color</Text>
              </TouchableOpacity>
            )} */}
          </View>
        </View>
      </TouchableOpacity>
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Works</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterSection}>
            <Text style={styles.filterTitle}>Media Types</Text>
            <View style={styles.filterActions}>
              <TouchableOpacity onPress={selectAllMediaTypes}>
                <Text style={styles.filterAction}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearMediaTypes}>
                <Text style={styles.filterAction}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaTypeGrid}>
              {ALL_MEDIA_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mediaTypeFilter,
                    selectedMediaTypes.includes(type) && styles.mediaTypeFilterSelected
                  ]}
                  onPress={() => toggleMediaType(type)}
                >
                  <Text style={[
                    styles.mediaTypeFilterText,
                    selectedMediaTypes.includes(type) && styles.mediaTypeFilterTextSelected
                  ]}>
                    {mediaUtils.getMediaTypeLabel(type)}
                  </Text>
                  <Text style={styles.mediaTypeCount}>
                    ({works.filter(w => w.mediaType === type).length})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {(['recent', 'popular', 'trending'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortOption,
                    sortBy === option && styles.sortOptionSelected
                  ]}
                  onPress={() => setSortBy(option)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextSelected
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && works.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading creative universe...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with filter button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Creative Universe</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>🔧 Filter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Active filters summary */}
      <View style={styles.activeFilters}>
        <Text style={styles.activeFiltersText}>
          Showing {filteredWorks.length} of {works.length} works
          {selectedMediaTypes.length < ALL_MEDIA_TYPES.length && 
            ` • ${selectedMediaTypes.length} media types`
          }
        </Text>
      </View>
      <FlatList
        data={works}
        renderItem={renderWorkItem}
        keyExtractor={(item: CreativeWork) => item.id}
        contentContainerStyle={styles.gallery}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No creative works yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to upload some art!
            </Text>
          </View>
        }
      />
      {renderFilterModal()}
      
      {/* Upload FAB */}
      <TouchableOpacity 
        style={styles.uploadFab}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.uploadFabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#475569',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#64748b',
  },
  mediaTypeBadge: {
    fontSize: 11,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  remixBadge: {
    fontSize: 11,
    color: '#7c3aed',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  remixButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
  },
  remixButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
  },
  filterSection: {
    padding: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterAction: {
    fontSize: 14,
    color: '#7C3AED',
    textDecorationLine: 'underline',
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
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaTypeFilterSelected: {
    backgroundColor: '#7C3AED',
  },
  mediaTypeFilterText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  mediaTypeFilterTextSelected: {
    color: 'white',
  },
  mediaTypeCount: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOptionSelected: {
    backgroundColor: '#7C3AED',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: 'white',
  },
  applyButton: {
    backgroundColor: '#7C3AED',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadFabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  gallery: {
    padding: 8,
  },
  workCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workImage: {
    width: '100%',
    height: 350,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  workInfo: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  workMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  colorableBadge: {
    fontSize: 12,
    color: '#155724',
    backgroundColor: '#d4edda',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    alignItems: 'center',
  },
  colorButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GalleryScreen;