import React from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { mockArtworks } from '../data/mockData';

const GalleryScreen = 
({ navigation }) => {
    const renderArtworkItem =
({ item }) => (
    <TouchableOpacity
    style={styles.artworkCard}
    onPress={() =>
        navigation.navigate('ArtworkDetail', { artwork: item})}
        >
            <Image
            source={{ uri: item.lineArtUrl }}
            style={styles.artworkImage}
            resizeMode='contain'
            />
            <View
            style={styles.artworkInfo}>
                <Text style={styles.title}> {item.title}
                </Text>
                <Text style={styles.artist}>{item.artist}
                </Text>
                <View style={styles.stats}>
                    <Text style={styles.stat}>
                        {item.colorizeVersions.length}
                        colorizations
                    </Text>
                    <Text style={styles.stat}>
                        {item.likes.length}
                        likes
                    </Text>
                </View>
            </View>
            </TouchableOpacity>
            
        );

        