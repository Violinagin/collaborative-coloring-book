import { Artwork, User } from "../types/User";

// In your mockData.ts, expand the mockUsers array:
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
      likedArtworks: ['1', '3'],
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
      following: ['user-1', 'user-3'],
      uploadedArtworks: [],
      colorizedVersions: ['c1', 'c2'],
      likedArtworks: ['1'],
      recentActivity: []
    },
    {
      id: 'user-3',
      username: 'sketchartist',
      displayName: 'Sketch Artist',
      avatarUrl: 'https://example.com/avatar3.jpg',
      bio: 'Daily sketches and character designs',
      roles: ['line_artist'],
      joinedDate: new Date('2024-02-01'),
      followers: ['user-1'],
      following: ['user-2'],
      uploadedArtworks: ['3'],
      colorizedVersions: [],
      likedArtworks: ['1', '2'],
      recentActivity: []
    },
    {
      id: 'user-4',
      username: 'beginnerartist',
      displayName: 'Beginner Artist',
      avatarUrl: 'https://example.com/avatar4.jpg',
      bio: 'Just starting my art journey!',
      roles: ['line_artist', 'supporter'],
      joinedDate: new Date('2024-03-01'),
      followers: [],
      following: ['user-1', 'user-2', 'user-3'],
      uploadedArtworks: [],
      colorizedVersions: [],
      likedArtworks: ['1', '2', '3'],
      recentActivity: []
    }
  ];
  
  // Expand your mockArtworks array:
  export const mockArtworks: Artwork[] = [
    {
      id: '1',
      title: 'Forest Creatures',
      description: 'A magical forest with friendly creatures waiting for color!',
      artist: 'Line Art Lover',
      artistId: 'user-1',
      lineArtUrl: 'https://example.com/forest-lineart.png',
      colorizedVersions: [
        {
          id: 'c1',
          colorist: 'Color Master',
          coloristId: 'user-2',
          coloredImageUrl: 'https://example.com/forest-colored.png',
          createdAt: new Date('2024-01-15')
        }
      ],
      likes: ['user-2', 'user-3', 'user-4'],
      comments: [
        {
          id: 'cm1',
          userId: 'user-2',
          userName: 'Color Master',
          text: 'Loved coloring this! Lots of amazing detail.',
          createdAt: new Date('2024-01-16')
        },
        {
          id: 'cm2', 
          userId: 'user-3',
          userName: 'Sketch Artist',
          text: 'Beautiful line work! The composition is perfect.',
          createdAt: new Date('2024-01-17')
        }
      ],
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      title: 'Ocean Waves',
      description: '',
      artist: 'Line Art Lover', 
      artistId: 'user-1',
      lineArtUrl: 'https://example.com/ocean-lineart.png',
      colorizedVersions: [
        {
          id: 'c2',
          colorist: 'Color Master',
          coloristId: 'user-2', 
          coloredImageUrl: 'https://example.com/ocean-colored.png',
          createdAt: new Date('2024-02-01')
        }
      ],
      likes: ['user-3'],
      comments: [
        {
          id: 'cm3',
          userId: 'user-3',
          userName: 'Sketch Artist',
          text: 'The flow of the waves is mesmerizing!',
          createdAt: new Date('2024-02-02')
        }
      ],
      createdAt: new Date('2024-01-25')
    },
    {
      id: '3',
      title: 'Mountain Range',
      description: '',
      artist: 'Sketch Artist',
      artistId: 'user-3',
      lineArtUrl: 'https://example.com/mountains-lineart.png',
      colorizedVersions: [],
      likes: ['user-1', 'user-4'],
      comments: [
        {
          id: 'cm4',
          userId: 'user-1', 
          userName: 'Line Art Lover',
          text: 'Stunning perspective! Would love to color this.',
          createdAt: new Date('2024-02-05')
        }
      ],
      createdAt: new Date('2024-02-03')
    }
  ];

export type { Artwork };
