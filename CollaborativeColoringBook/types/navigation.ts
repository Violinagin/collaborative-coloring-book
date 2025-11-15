import { Artwork } from '../data/mockData';

export type RootStackParamList = {
  Gallery: undefined;  
  ArtworkDetail: { artwork: Artwork }; 
};