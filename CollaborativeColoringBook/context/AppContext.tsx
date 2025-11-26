// context/AppContext.tsx - CLEANED VERSION
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Artwork, User } from '../types/User';

type AppState = {
  artworks: Artwork[];
  users: User[];
  currentUser: User | null; // Changed to null since we might not have a user
};

type AppAction = 
  | { type: 'ADD_ARTWORK'; payload: Artwork }
  | { type: 'TOGGLE_LIKE'; payload: { artworkId: string; userId: string } }
  | { type: 'ADD_COMMENT'; payload: { artworkId: string; comment: any } };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
      case 'ADD_ARTWORK':
        return {
          ...state,
          artworks: [...state.artworks, action.payload]
        };
      
      case 'TOGGLE_LIKE':
        return {
          ...state,
          artworks: state.artworks.map(artwork => {
            if (artwork.id === action.payload.artworkId) {
              const isLiked = artwork.likes.includes(action.payload.userId);
              return {
                ...artwork,
                likes: isLiked 
                  ? artwork.likes.filter(id => id !== action.payload.userId)
                  : [...artwork.likes, action.payload.userId]
              };
            }
            return artwork;
          })
        };
        
      case 'ADD_COMMENT':
        return {
          ...state,
          artworks: state.artworks.map(artwork => {
            if (artwork.id === action.payload.artworkId) {
              return {
                ...artwork,
                comments: [...artwork.comments, action.payload.comment]
              };
            }
            return artwork;
          })
        };
      
      default:
        return state;
    }
};

type AppProviderProps = {
  children: ReactNode;
};  

// ✅ UNCOMMENT AND UPDATE THIS - No more mock data!
export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, {
    artworks: [], // Start with empty array - real data will be loaded
    users: [],    // Start with empty array
    currentUser: null, // Start with null
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hooks that use the unified context
export const useArtwork = (artworkId: string) => {
  const { state } = useApp();
  return state.artworks.find(a => a.id === artworkId);
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};