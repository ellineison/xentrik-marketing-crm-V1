
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  UserCog, 
  Lock,
  FileUp,
  Mic,
  Shield,
  UserPlus,
  ListCheck,
  Database,
  Kanban,
  DollarSign,
  VolumeX
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  roles?: string[]; // Specific roles that can access this item
  allowCreator?: boolean; // Allow Creator role to access this item
  hideForCreator?: boolean; // Hide this item for Creator role
  hideForChatter?: boolean; // Hide this item for Chatter role
  hidden?: boolean; // Hide this item completely
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarNavProps {
  isAdmin: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "Administrative Team",
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
        allowCreator: true,
        hideForChatter: true,
      },
      {
        path: '/creators',
        label: 'Creators',
        icon: <Users className="h-5 w-5" />,
        hideForCreator: true,
        hideForChatter: true,
      },
      {
        path: '/shared-files',
        label: 'Shared Files',
        icon: <FileUp className="h-5 w-5" />,
        allowCreator: true,
        hideForChatter: true,
      },
      {
        path: '/team',
        label: 'Team',
        icon: <UserCog className="h-5 w-5" />,
        hideForCreator: true,
        hideForChatter: true,
      },
      {
        path: '/secure-logins',
        label: 'Secure Logins',
        icon: <Lock className="h-5 w-5" />,
        allowCreator: true,
        hideForChatter: true,
      },
      {
        path: '/onboard-queue',
        label: 'Onboard Queue',
        icon: <ListCheck className="h-5 w-5" />,
        adminOnly: true,
      },
      {
        path: '/access-control',
        label: 'Access Control',
        icon: <Shield className="h-5 w-5" />,
        adminOnly: true,
      },
      {
        path: '/users',
        label: 'User Management',
        icon: <Users className="h-5 w-5" />,
        adminOnly: true,
      },
    ]
  },
  {
    title: "Chatting Team",
    items: [
      {
        path: '/creators-data',
        label: 'Model Profile',
        icon: <Database className="h-5 w-5" />,
        roles: ['Admin', 'VA', 'Chatter'],
      },
      {
        path: '/customs-tracker',
        label: 'Customs Tracker',
        icon: <Kanban className="h-5 w-5" />,
        hideForCreator: true,
      },
      {
        path: '/payroll',
        label: 'Payroll',
        icon: <DollarSign className="h-5 w-5" />,
        roles: ['Admin', 'VA', 'Chatter', 'HR / Work Force'],
        hideForCreator: true,
      },
      {
        path: '/voice-generation',
        label: 'Voice Generator',
        icon: <Mic className="h-5 w-5" />,
        adminOnly: true,
      },
      {
        path: '/voice-clone',
        label: 'Voice Clone',
        icon: <VolumeX className="h-5 w-5" />,
        adminOnly: true,
      },
    ]
  },
  {
    title: "Marketing Team",
    items: [
      {
        path: '/marketing-files',
        label: 'Marketing Files',
        icon: <FileUp className="h-5 w-5" />,
        allowCreator: true,
        hideForChatter: true,
      },
    ]
  }
];

// Hidden items not shown in any group
const hiddenItems: NavItem[] = [
  {
    path: '/messages',
    label: 'Messages',
    icon: <MessageSquare className="h-5 w-5" />,
    hideForCreator: true,
    hideForChatter: true,
    hidden: true,
  },
  {
    path: '/onboard',
    label: 'Creator Onboarding',
    icon: <UserPlus className="h-5 w-5" />,
    hidden: true,
  },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ isAdmin }) => {
  const { userRole, userRoles, isCreator } = useAuth();
  
  const shouldShowItem = (item: NavItem): boolean => {
    // CRITICAL: Admin users can see ALL modules regardless of other restrictions
    // This must be the FIRST check and return immediately
    if (userRole === 'Admin' || userRoles?.includes('Admin')) {
      return !item.hidden; // Only skip completely hidden items
    }
    
    // Skip items that are completely hidden
    if (item.hidden) return false;
    
    // Marketing Team employees should see Marketing Files + Model Profile
    if (userRole === 'Marketing Team' || userRoles?.includes('Marketing Team')) {
      return item.path === '/marketing-files' || item.path === '/creators-data';
    }
    
    // Chatter employees should ONLY see Chatting Team items (this won't affect Admin-Chatter users)
    if (userRole === 'Chatter' || userRoles?.includes('Chatter')) {
      return item.path === '/creators-data' || item.path === '/customs-tracker' || item.path === '/payroll';
    }
    
    // VA employees should see specific items
    if (userRole === 'VA' || userRoles?.includes('VA')) {
      return item.path === '/creators-data' || item.path === '/payroll' ||
             item.path === '/marketing-files' || item.path === '/shared-files';
    }
    
    // HR / Work Force employees should see everything like Admin
    if (userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force')) {
      return !item.hidden;
    }
    
    // Skip adminOnly items if user is not admin
    if (item.adminOnly && !isAdmin) return false;
    
    // For Creator role users, only show items that explicitly allow Creator
    if (isCreator && userRole === 'Creator') {
      if (!item.allowCreator) return false;
    }
    
    // Skip items that should be hidden for creators if the user is a creator
    if (item.hideForCreator && isCreator) return false;
    
    // Check specific roles if defined
    if (item.roles) {
      const hasRequiredRole = item.roles.some(role => 
        userRole === role || (userRoles && userRoles.includes(role))
      );
      if (!hasRequiredRole) return false;
    }
    
    return true;
  };

  const shouldShowGroup = (groupTitle: string): boolean => {
    // CRITICAL: Admin users can see ALL groups - this must be first
    if (userRole === 'Admin' || userRoles?.includes('Admin')) {
      return true;
    }

    // Developer and HR / Work Force can see everything
    if (userRole === 'Developer' || userRoles?.includes('Developer') ||
        userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force')) {
      return true;
    }

    // Marketing Team employees see Marketing Team category + Model Profile (without Chatting Team title)
    if (userRole === 'Marketing Team' || userRoles?.includes('Marketing Team')) {
      return groupTitle === 'Marketing Team' || groupTitle === 'Chatting Team';
    }

    // Chatter employees only see Chatting Team category
    if (userRole === 'Chatter' || userRoles?.includes('Chatter')) {
      return groupTitle === 'Chatting Team';
    }

    // VA employees see Chatting Team + Marketing Team (Shared Files is handled separately)
    if (userRole === 'VA' || userRoles?.includes('VA')) {
      return groupTitle === 'Chatting Team' || groupTitle === 'Marketing Team';
    }

    return true;
  };

  const shouldShowSharedFilesForVA = (): boolean => {
    return userRole === 'VA' || userRoles?.includes('VA');
  };

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.path}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300",
              {
                "bg-gradient-premium-yellow text-black": isActive,
                "hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5": !isActive
              }
            )
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  // Check if user should get admin-style navigation with grouped categories
  const shouldShowAdminNavigation = userRole === 'Admin' || userRoles?.includes('Admin') || 
                                   userRole === 'Developer' || userRoles?.includes('Developer') ||
                                   userRole === 'HR / Work Force' || userRoles?.includes('HR / Work Force') ||
                                   isAdmin; // Use the isAdmin prop as final authority

  // For non-admin users, collect all visible items into a single group to avoid spacing issues
  if (!shouldShowAdminNavigation) {
    const allVisibleItems: NavItem[] = [];
    
    navGroups.forEach((group) => {
      if (!shouldShowGroup(group.title)) return;

      let visibleItems = group.items.filter(shouldShowItem);
      
      // Special handling for VA employees - they see Shared Files from Administrative Team
      if (group.title === 'Administrative Team' && shouldShowSharedFilesForVA()) {
        visibleItems = visibleItems.filter(item => item.path === '/shared-files');
      } else if (group.title === 'Administrative Team' && (
        userRole === 'Marketing Team' || userRoles?.includes('Marketing Team') ||
        userRole === 'Chatter' || userRoles?.includes('Chatter')
      )) {
        // Marketing Team and Chatter shouldn't see Administrative Team items at all
        return;
      }
      
      allVisibleItems.push(...visibleItems);
    });

    return (
      <nav className="pt-2 z-30 relative">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allVisibleItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </nav>
    );
  }

  // For admin/developer users, show with category titles and spacing
  return (
    <nav className="grid gap-4 pt-2 z-30 relative">
      {navGroups.map((group) => {
        // Check if this group should be shown for the current user
        if (!shouldShowGroup(group.title)) return null;

        let visibleItems = group.items.filter(shouldShowItem);
        
        // Special handling for VA employees - they see Shared Files from Administrative Team
        if (group.title === 'Administrative Team' && shouldShowSharedFilesForVA()) {
          visibleItems = visibleItems.filter(item => item.path === '/shared-files');
        } else if (group.title === 'Administrative Team' && (
          userRole === 'Marketing Team' || userRoles?.includes('Marketing Team') ||
          userRole === 'Chatter' || userRoles?.includes('Chatter')
        )) {
          // Marketing Team and Chatter shouldn't see Administrative Team items at all
          return null;
        }
        
        // Don't render the group if no items are visible
        if (visibleItems.length === 0) return null;
        
        return (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </nav>
  );
};

export default SidebarNav;
