import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, Swords, Store, Settings } from 'lucide-react';
import GameBoard from '@/components/gamification/GameBoard';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import ChatterQuestsPage from '@/components/gamification/ChatterQuestsPage';
import SupplyDepot from '@/components/gamification/SupplyDepot';
import PlayerCard from '@/components/gamification/PlayerCard';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/gamification.css';

const LOGO_PATH = 'xentrik-logo.png';
const BUCKET_NAME = 'logos';

const TasksRewards: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, userRoles, isLoading } = useSupabaseAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Wait for auth to finish loading before determining admin status
  const isAdmin = !isLoading && (userRole === 'Admin' || userRoles?.includes('Admin'));

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(LOGO_PATH);
        if (publicUrl) {
          setLogoUrl(publicUrl);
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);
  
  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname.includes('/control-panel')) return 'control-panel';
    if (location.pathname.includes('/quests')) return 'quests';
    if (location.pathname.includes('/supply-depot')) return 'supply-depot';
    return 'game-board';
  };

  const activeTab = getActiveTab();

  // Separate navigation items for admin vs non-admin
  // Admin ONLY sees Control Panel
  // Non-admin sees Game Board, Quests, Supply Depot
  const adminNavItems = [
    { id: 'control-panel', label: 'Control Panel', icon: Settings, path: '/tasks-rewards/control-panel' },
  ];

  const playerNavItems = [
    { id: 'game-board', label: 'Game Board', icon: Gamepad2, path: '/tasks-rewards' },
    { id: 'quests', label: 'Quests', icon: Swords, path: '/tasks-rewards/quests' },
    { id: 'supply-depot', label: 'Supply Depot', icon: Store, path: '/tasks-rewards/supply-depot' },
  ];

  const visibleNavItems = isAdmin ? adminNavItems : playerNavItems;

  const renderContent = () => {
    // Admin can ONLY access control-panel
    if (isAdmin) {
      // Redirect admin to control-panel if they're on any other tab
      if (activeTab !== 'control-panel') {
        navigate('/tasks-rewards/control-panel', { replace: true });
        return <QuestsPanel isAdmin={isAdmin} />;
      }
      return <QuestsPanel isAdmin={isAdmin} />;
    }

    // Non-admin logic
    switch (activeTab) {
      case 'control-panel':
        // Non-admins cannot access control panel - redirect to game board
        navigate('/tasks-rewards', { replace: true });
        return <GameBoard isAdmin={false} />;
      case 'quests':
        return <ChatterQuestsPage />;
      case 'supply-depot':
        return <SupplyDepot />;
      default:
        return <GameBoard isAdmin={isAdmin} />;
    }
  };

  return (
    <div
      className="gamification-module flex min-h-screen w-full"
      style={
        activeTab === 'control-panel'
          ? undefined
          : { fontFamily: "'Orbitron', sans-serif" }
      }
    >
      {/* Left Sidebar Navigation - Fixed position */}
      <nav
        className="gamification-sidebar shrink-0 border-r-2 p-6 flex flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ width: '20rem' }}
      >
        <div className="mb-6 flex items-center justify-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Xentrik Marketing"
              className="h-[70px] w-auto object-contain"
            />
          )}
        </div>

        {/* Player Card */}
        <PlayerCard />
        
        <div className="space-y-2 flex-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "gamification-nav-item w-full",
                  isActive && "gamification-nav-item-active"
                )}
              >
                <Icon className="h-6 w-6 shrink-0" />
                <span className="text-base">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="gamification-content flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
        <div className="w-full max-w-none">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default TasksRewards;
