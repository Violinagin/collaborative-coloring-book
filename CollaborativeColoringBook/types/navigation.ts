import { CreativeWork } from './core'; 

export type RootStackParamList = {
  Gallery: undefined;  
  ArtworkDetail: { artwork: CreativeWork };
  Profile: { userId: string }; 
//  Coloring: { artwork: CreativeWork };
  SkiaColoring: { 
    imageUrl: string;
    title?: string;
  };
  Upload: undefined;
  Auth: undefined;
  EditProfile: undefined;
};