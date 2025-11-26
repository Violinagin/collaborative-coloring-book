import { CreativeWork } from './core'; 
import { User } from './User';

export type RootStackParamList = {
  Gallery: undefined;  
  ArtworkDetail: { artwork: CreativeWork };
  Profile: { userId: string }; 
  Coloring: { artwork: CreativeWork };
  Upload: undefined;
  Auth: undefined;
  EditProfile: undefined;
};