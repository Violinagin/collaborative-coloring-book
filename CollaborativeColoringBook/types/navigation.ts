import { CreativeWork, User  } from './core'; 

export type RootStackParamList = {
  Gallery: { 
    showFilterModal?: boolean;
  };  
  ArtworkDetail: { workId: string };
  Profile: { userId: string; }; 
//  Coloring: { artwork: CreativeWork };
  SkiaColoring: { 
    work: CreativeWork;
    imageUrl: string;
    title?: string;
  };
  Upload: {
    originalWorkId?: string;
    originalWorkTitle?: string;
    originalWork?: CreativeWork;
  } | undefined;
  CreateRemix: {
    originalWorkId: string;
    originalWorkTitle?: string;
  };
  Debug: undefined;
  Auth: undefined;
  EditProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}