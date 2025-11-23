import { Artwork } from '../data/mockData';
import { User } from './User';

export type RootStackParamList = {
  Gallery: undefined;  
  ArtworkDetail: { artwork: Artwork };
  Profile: { userId: string }; 
  Coloring: { artwork: Artwork };
  Upload: undefined;
  Auth: undefined;
  EditProfile: undefined;
};