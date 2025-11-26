// // types/collaboration.ts

// export interface Collaboration {
//     id: string;
//     originalWorkId: string;
//     derivedWorkId: string;
//     collaborationType: CollaborationType;
//     description?: string;
//     attribution: string;        // How to credit the collaboration
//     createdAt: Date;
//   }
  
//   // A work with its collaboration context
//   export interface WorkWithContext {
//     work: CreativeWork;
//     originalWork?: CreativeWork;  // If this is a derivative
//     collaborations: Collaboration[]; // Works derived from this one
//     artist: User;
//   }