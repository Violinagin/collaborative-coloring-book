import { User, Activity } from '../types/User';

export interface Artwork {
    id: string;
    title: string;
    artist: string;
    artistId: string;
    lineArtUrl: string;
    colorizedVersions: ColorizedVersion[];
    likes: string[];
    comments: Comment[];
    createdAt: Date;
}

export interface ColorizedVersion {
    id: string;
    colorist: string;
    coloristId: string;
    coloredImageUrl: string;
    createdAt: Date;
}

export interface Comment{
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
}

//Mock Data
export const mockUsers: User[] = [
    {
        id: 'user-1',
        username: 'lineartlover',
        displayName: 'Line Art Lover',
        avatarUrl: 'https://example.com/avatar1.jpg',
        bio: 'Passionate about creating intricate line art for others to bring to life with color!',
        roles: ['line_artist', 'colorist'],
        joinedDate: new Date('2024-01-01'),
        followers: ['user-2', 'user-3'],
        following: ['user-2'],
        uploadedArtworks: ['1', '2'],
        colorizedVersions: ['c1'],
        likedArtworks: ['1'],
        recentActivity: []
    },
    {
        id: 'user-2', 
        username: 'colormaster',
        displayName: 'Color Master',
        avatarUrl: 'https://example.com/avatar2.jpg',
        bio: 'Bringing line art to life with vibrant colors!',
        roles: ['colorist'],
        joinedDate: new Date('2024-01-15'),
        followers: ['user-1'],
        following: ['user-1'],
        uploadedArtworks: [],
        colorizedVersions: ['c1'],
        likedArtworks: ['1'],
        recentActivity: []
    }
];

export const mockArtworks: Artwork[] = [
    {
        id: '1',
        title: 'Forest Creatures',
        artist: 'LineArtLover',
        artistId: 'user-1',
        lineArtUrl: 'https://example.com/forest-lineart.png',
        colorizedVersions: [
            {
                id: 'c1',
                colorist: 'ColorMaster',
                coloristId: 'user-2',
                coloredImageUrl: 'https://example.com/forest-colored.png',
                createdAt: new Date('2024-01-15')
            }
        ],
        likes: ['user-2'],
        comments: [
            {
                id: 'cm1',
                userId: 'user-2',
                userName: 'ColorMaster',
                text: 'Loved coloring this! Lots of amazing detail.',
                createdAt: new Date('2024-01-16')
            }
        ],
        createdAt: new Date('2024-01-10')
    }
    //add more mock artworks here
];