import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  ListRenderItem 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockArtworks, Artwork } from '../data/mockData';
import LikeButton from '../components/LikeButton';
import { useLikes } from '../context/LikesContext';

// Define your navigation types
type RootStackParamList = {
  Gallery: undefined;
  ArtworkDetail: { artwork: Artwork }; // We'll create this screen later
};

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

// Type for the renderItem function
interface RenderItemProps {
  item: Artwork;
  navigation: Props['navigation'];
}

const GalleryScreen = ({ navigation }: Props) => {
  // Properly typed render function
  const { artworks, toggleLike, isLiked, getLikeCount } = useLikes();
  const renderArtworkItem: ListRenderItem<Artwork> = ({ item }) => (
    <TouchableOpacity 
      style={styles.artworkCard}
      onPress={() => navigation.navigate('ArtworkDetail', { artwork: item })}
    >
      <Image 
        source={{ uri: item.lineArtUrl }} 
        style={styles.artworkImage}
        resizeMode="contain"
      />
      <View style={styles.artworkInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.artist}>by {item.artist}</Text>
        <View style={styles.likeContainer}>
          <LikeButton 
            isLiked={isLiked(item.id)}
            likeCount={getLikeCount(item.id)}
            onPress={() => toggleLike(item.id)}
            size="small"
          />
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>
            {item.colorizedVersions.length} colorizations
          </Text>
          <Text style={styles.stat}>
            {item.likes.length} likes
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={artworks}
        renderItem={renderArtworkItem}
        keyExtractor={(item: Artwork) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gallery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gallery: {
    padding: 8,
  },
  artworkCard: {
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
  artworkImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  artworkInfo: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stat: {
    fontSize: 12,
    color: '#888',
  },
  likeContainer: {
    marginTop: 8,
    alignItems: 'flex-start', // Align like button to the left
  },
});

export default GalleryScreen;