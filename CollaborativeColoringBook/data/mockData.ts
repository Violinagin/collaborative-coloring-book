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
        id: '1',
        name: 'LineArtLover',
        avatarUrl: 'https://example.com/avatar1.jpg',
        bio: 'I love creating all the line art for everyone to color!'
    },
    {
        id: '2',
        name: 'ColorMaster',
        avatarUrl: 'https://example.com/avatar2.jpg',
        bio: 'Bringing line art to life wiht color!'
    }
];

export const mockArtworks:
Artwork[] = [
    {
        id: '1',
        title: 'Forest Creatures',
        artist: 'LineArtLover',
        artistId: '1',
        lineArtUrl: 'https://example.com/forest-lineart.png',
        colorizedVersions: [
            {
                id: 'c1',
                colorist: 'ColorMaster',
                coloristId: '2',
                coloredImageUrl: 'https://example.com/forest-colored.png',
                createdAt: new Date('2024-01-15')
            }
        ],
        likes: ['2'],
        comments: [
            {
                id: 'cm1',
                userId: '2',
                userName: 'ColorMaster',
                text: 'Loved coloring this! Lots of amazing detail.',
                createdAt: new Date('2024-01-16')
            }
        ]
        createdAt: new
        Date('2024-01-10')
    }
];