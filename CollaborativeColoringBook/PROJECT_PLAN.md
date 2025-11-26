# Collaborative Coloring Book - Project Plan

## Core Concept

Social platform connecting artists of different roles (artist, writer, musician, animation, ect) for collaboration. And artist can upload an original project and other artists can build on the idea if they are so inspired.

## User Roles
1. **Signed Up** - Can use the whole function of the app, but limits on sizes and amounts
2. **Supporters** - Have paid other artists tips  
3. **Viewers** - Browse, share through email
4. **App Supporters** - Paid for app, more upload space, other perks
5. **OriginalArtist** - Uploads original Project
6. **Muse** - OriginalArtist whose work has inspired new art.
7. **Inspired** - Artist who has uploaded new art inspired by original art.

## Technical Architecture

### Frontend (React Native/Expo)
- **Screens**:
  - Gallery (artwork feed)
  - Artwork Detail (view, like, comment, InspiredArt)
  - Coloring Canvas (digital coloring tool)
  - Coloring Book (digital color FILL tool)
  - Upload
  - User Profiles
  - Profile Edit
  - Social Feed (future)

### Backend
- User authentication
- Image storage & processing
- Social features (follow, notifications)
- Real-time updates (future)

### Current Project Organization

COLLABORATIVECOLORINGBOOK/
├── assets/
│   └── adaptive-icon.png
│       └── need
│   └── favicon.png
│       └── need
│   └── icon.png
│       └── need
│   └── splash-icon.png
│       └── need
├── components/
│   └── CommentButton.tsx
│   └── HeaderRight.tsx
│   └── LikeButton.tsx
│   └── LineArtBackground.tsx
│   └── RemoteSVG.tsx
├── context/
│   └── AppContext.tsx
│       └── ADD_ARTWORK
│       └── TOGGLE_LIKE
│       └── ADD_COMMENT
│   └── AuthContext.tsx
│       └── user
│       └── session
│       └── loading,
│       └── signUp,
│       └── signIn,
│       └── signOut,
│       └── updateUser,
│   └── CommentsContext.tsx
│       └── return
│           └── artworks,
│           └── addComment,
│           └── getComments,
│           └── getCommentCount,
│       └── export
│           └── useComments
│   └── LikesContext.tsx
├── data/
├── hooks/
├── lib/
│   └── supabase.ts (createClient)
├── screens/
│   └── ArtworkDetailScreen.tsx
│   └── AuthScreen.tsx
│   └── ColoringScreen.tsx
│   └── EditProfileScreen.tsx
│   └── GalleryScreen.tsx
│   └── ProfileScreen.tsx
│   └── UploadScreen.tsx
├── services/
│   └── directSupabaseService.ts
│   └── worksService.ts
├── types/
│   └── core.ts
│   └── navigation.ts
│   └── User.ts
├── utils
│   └── mediaUtils.ts
│   └── typeConverters.ts
├── App.tsx
├── app.json
├── tsconfig.json
└── package.json

## Feature Roadmap

### Phase 1: MVP (Current)
✅ Basic gallery with mock data  
✅ Navigation between screens  
✅ Artwork detail view  
✅ Like system  
✅ Comment functionality  

### Phase 2: Core Features
✅ User authentication
✅ Image upload for line art
🔲 Image upload for orginal art (or refactor image upload to handle both)
🔲 Image upload for inspired art
🔲 Image Card Component
🔲 Image Thumbnail Component
✅ Basic coloring tool
🔲 Medium color FILL tool
✅ User profiles
✅ Persistent data storage

### Phase 3: Social
✅ Follow system
🔲 Notifications
🔲 Save/Favorite Art system

### Phase 4: Advanced
🔲 Collections & categories
🔲 Search & discovery
🔲 Advanced coloring tools (color wheel, eraser, layers, ect)

### Phase 5: Polish
🔲 Performance optimization
🔲 Advanced social features
🔲 Fix Navigation to be more intuitive
🔲 Change all alerts to be proper modals

### Phase 6: Scale
🔲 Monetization (optional)
🔲 Admin dashboard