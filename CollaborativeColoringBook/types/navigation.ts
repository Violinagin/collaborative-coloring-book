import { CreativeWork, RemixType, UploadableMediaType  } from './core'; 

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
  Upload: {
    originalWorkId?: string;
    originalWork?: CreativeWork;
  } | undefined;
  CreateRemix: {
    originalWorkId: string;
    originalWorkTitle?: string;
  };
  Auth: undefined;
  EditProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}