import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { User, UserRole, Artwork } from '../types/User';
import { mockArtworks } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// Mock user data for now - we'll replace with real data later
const mockUser: User = {
    id: 'user-1',
    username: 'lineartlover',
    displayName: 'Line Art Lover',
    avatarUrl: 'https://example.com/avatar1.jpg',
    bio: 'Passionate about creating intricate line art for others to bring to life with color!',
    roles: ['line_artist', 'colorist'],
    joinedDate: new Date('2024-01-01'),
    followers: ['user-2', 'user-3'],
    following: ['user-2'],
    uploadedArtworks: ['1', '2'], // This user uploaded artworks with IDs '1' and '2'
    colorizedVersions: ['c1'],
    likedArtworks: ['1'],
    recentActivity: []
  };

const ProfileScreen = ({ route, navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'lineArt' | 'colorWork' | 'activity'>('lineArt');
  
  // For now, using mock data - we'll get real user data from route.params later
  const user = mockUser;

  const userLineArt = mockArtworks.filter(artwork => 
    user.uploadedArtworks.includes(artwork.id)
  );

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

  const renderLineArtTab = () => (
    <FlatList
      data={userLineArt}
      numColumns={2}
      renderItem={({ item }: { item: Artwork }) => (
        <TouchableOpacity style={styles.artworkItem}>
          <Image source={{ uri: item.lineArtUrl }} style={styles.artworkImage} />
        </TouchableOpacity>
      )}
      keyExtractor={(item: Artwork) => item.id}
      contentContainerStyle={styles.galleryGrid}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No line art uploaded yet</Text>
      }
    />
  );

  const renderColorWorkTab = () => (
    <Text style={styles.comingSoon}>Color work gallery coming soon!</Text>
  );

  const renderActivityTab = () => (
    <Text style={styles.comingSoon}>Activity feed coming soon!</Text>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
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
          <Text style={styles.statNumber}>{user.colorizedVersions.length}</Text>
          <Text style={styles.statLabel}>Colorizations</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{user.followers.length}</Text>
          <Text style={styles.statLabel}>Followers</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontStyle: 'italic',
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
  comingSoon: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ProfileScreen;