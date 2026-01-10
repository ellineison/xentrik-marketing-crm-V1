
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import PageTransition from '../PageTransition';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import SidebarLogo from '../sidebar/SidebarLogo';
import SidebarNav from '../sidebar/SidebarNav';
import SidebarUserSection from '../sidebar/SidebarUserSection';
import { useRouteMemory } from '@/hooks/useRouteMemory';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const { user, userRole } = useSupabaseAuth();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  
  useRouteMemory();
  
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setPageTitle('Dashboard');
    else if (path.includes('/creators')) setPageTitle('Creators');
    else if (path.includes('/team')) setPageTitle('Team');
    else if (path.includes('/users')) setPageTitle('User Management');
    else if (path.includes('/messages')) setPageTitle('Messages');
    else if (path.includes('/shared-files')) setPageTitle('Shared Files');
    else if (path.includes('/marketing-files')) setPageTitle('Marketing Files');
    else if (path.includes('/creator-files')) setPageTitle('Creator Files');
    else if (path.includes('/creator-marketing-files')) setPageTitle('Creator Marketing Files');
    else if (path.includes('/secure-logins')) setPageTitle('Secure Logins');
    else if (path.includes('/account')) setPageTitle('Account Settings');
    else setPageTitle('Dashboard');
  }, [location.pathname]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("User is not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = user?.user_metadata?.role === "Admin" || userRole === "Admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent className="pt-8">
            <SidebarLogo />
            <div className="px-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent mt-4">
              <SidebarNav isAdmin={isAdmin} />
            </div>
            <div className="mt-auto p-3 border-t border-border/20">
              {user && <SidebarUserSection />}
            </div>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="bg-background overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/20 bg-card p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-lg font-semibold">{pageTitle}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationsDropdown />
            </div>
          </div>
          
          <PageTransition>
            <div className="max-w-full overflow-x-hidden">
              {children}
            </div>
          </PageTransition>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProtectedRoute;
