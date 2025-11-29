import { CreativeWork } from './core'; 

export type RootStackParamList = {
  Gallery: undefined;  
  ArtworkDetail: { work: CreativeWork };
  Profile: { userId: string }; 
//  Coloring: { artwork: CreativeWork };
  SkiaColoring: { 
    work: CreativeWork;
    imageUrl: string;
    title?: string;
  };
  Upload: undefined;
  Auth: undefined;
  EditProfile: undefined;
};