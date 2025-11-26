// // types/derivatives.ts

// // Track the full creative lineage
// export interface WorkWithLineage {
//     work: CreativeWork;
//     lineage: {
//       parents: CreativeWork[];      // Direct ancestors
//       children: CreativeWork[];     // Direct descendants  
//       siblings: CreativeWork[];     // Works from same original
//       fullTree: DerivativeTree;     // Complete family tree
//     };
//   }
  
//   export interface DerivativeTree {
//     work: CreativeWork;
//     derivatives: Array<{
//       work: CreativeWork;
//       collaboration: Collaboration;
//       derivatives: DerivativeTree[];  // Recursive!
//     }>;
//   }
  
//   // Service methods for derivative management
//   export const derivativeService = {
//     // Create a new derivative work
//     async createDerivative(originalWorkId: string, newWork: CreativeWork, collaboration: Collaboration): Promise<WorkWithLineage> {
//       // Build derivation chain: original's chain + original's ID
//       const original = await this.getWork(originalWorkId);
//       const derivationChain = [...original.derivationChain, originalWorkId];
      
//       return {
//         ...newWork,
//         originalWorkId,
//         derivationChain
//       };
//     },
    
//     // Get all derivatives of a work (multiple branches)
//     async getDerivativeTree(workId: string): Promise<DerivativeTree> {
//       // Recursively fetch all descendants
//     },
    
//     // Find all works that can be colored
//     async getColorableWorks(): Promise<CreativeWork[]> {
//       return works.filter(work => 
//         work.mediaType === 'line_art' || 
//         (work.mediaType === 'colored_art' && work.mediaConfig.isColorable)
//       );
//     }
//   };