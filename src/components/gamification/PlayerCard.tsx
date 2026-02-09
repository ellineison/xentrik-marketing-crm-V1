import React from 'react';
import { Crown } from 'lucide-react';
import { useGamification, GamificationRank } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';

// Rank crown colors based on rank name
export const RANK_CROWN_COLORS: Record<string, string> = {
  'Diamond': '#9b59b6',   // Purple
  'Platinum': '#3498db',  // Blue
  'Gold': '#f1c40f',      // Yellow
  'Silver': '#95a5a6',    // Gray
  'Iron': '#4a4a4a',      // Dark Gray
  'Wood': '#8B4513',      // Brown
  'Plastic': '#ffffff',   // White
};

export const getRankCrownColor = (rankName: string): string => {
  return RANK_CROWN_COLORS[rankName] || '#ffffff';
};

const PlayerCard: React.FC = () => {
  const { user, userRole, userRoles } = useAuth();
  const { myStats, ranks } = useGamification();

  // Determine the current rank based on XP
  const getCurrentRank = (): GamificationRank | null => {
    if (!myStats || !ranks.length) return null;
    
    const sortedRanks = [...ranks].sort((a, b) => a.sort_order - b.sort_order);
    
    for (const rank of sortedRanks) {
      const minXp = rank.min_xp;
      const maxXp = rank.max_xp;
      
      if (myStats.total_xp >= minXp && (maxXp === null || myStats.total_xp <= maxXp)) {
        return rank;
      }
    }
    
    // Default to lowest rank
    return sortedRanks[sortedRanks.length - 1] || null;
  };

  const currentRank = getCurrentRank();
  const crownColor = currentRank ? getRankCrownColor(currentRank.name) : '#ffffff';

  // Determine display role - show "Sales Rep" for Chatter role
  const getDisplayRole = (): string => {
    if (userRoles.includes('Chatter') || userRole === 'Chatter') {
      return 'Sales Rep';
    }
    return userRole || 'Employee';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Agent';
  const displayRole = getDisplayRole();

  return (
    <div 
      className="rounded-xl p-4 mb-6 border"
      style={{ 
        backgroundColor: 'rgba(211, 164, 45, 0.1)',
        borderColor: 'rgba(211, 164, 45, 0.3)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Crown Icon */}
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `${crownColor}20`,
          }}
        >
          <Crown 
            className="w-7 h-7" 
            style={{ color: crownColor }}
            fill={crownColor}
            strokeWidth={1.5}
          />
        </div>
        
        {/* Player Info - Left aligned */}
        <div className="flex-1 min-w-0 text-left">
          <h3 
            className="font-bold text-base truncate"
            style={{ 
              fontFamily: "'Orbitron', sans-serif",
              color: '#d3a42d'
            }}
          >
            {displayName}
          </h3>
          <p 
            className="text-sm opacity-70"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {displayRole}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
