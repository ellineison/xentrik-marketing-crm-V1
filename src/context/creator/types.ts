
import { Creator, EngagementStats } from "../../types";

export interface CreatorContextType {
  creators: Creator[];
  addCreator: (creator: Omit<Creator, "id">) => Promise<string | undefined>;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => Promise<boolean>;
  restoreCreator: (id: string) => Promise<boolean>;
  isDeleting: boolean;
  getCreator: (id: string) => Creator | undefined;
  getCreatorStats: (id: string) => EngagementStats | undefined;
  filterCreators: (filters: { 
    gender?: string[]; 
    team?: string[]; 
    creatorType?: string[]; 
    reviewStatus?: string[]; 
    marketingStrategy?: string[];
    searchQuery?: string; 
  }) => Creator[];
}
