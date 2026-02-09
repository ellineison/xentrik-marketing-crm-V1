
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupabaseAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  isCreator: boolean;
  creatorId: string | null;
  userRole: string;
  userRoles: string[];
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  updateCredentials: (credentials: { 
    email?: string; 
    password?: string;
    currentPassword?: string;
    displayName?: string;
    profileImage?: string;
  }) => Promise<boolean>;
  pendingUsers?: any[];
  approvePendingUser?: (userId: string, approved: boolean) => Promise<void>;
  createTeamMember: (data: { 
    username: string; 
    email: string; 
    role: string;
  }) => Promise<boolean>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('Employee');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to check creator status
  const checkCreatorStatus = async (userId: string) => {
    try {
      // First check if user has Creator role in profiles.roles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('roles, role')
        .eq('id', userId)
        .single();
        
      let hasCreatorRole = false;
      
      if (profileData?.roles && Array.isArray(profileData.roles) && profileData.roles.includes('Creator')) {
        hasCreatorRole = true;
        setIsCreator(true);
        localStorage.setItem('isCreator', 'true');
        setCreatorId(userId); // Set the creator ID to the user's ID
        localStorage.setItem('creatorId', userId);
        setUserRoles(profileData.roles);
        localStorage.setItem('userRoles', JSON.stringify(profileData.roles));
        
        // Ensure creator record exists and is approved
        await ensureCreatorRecord(userId);
      }
      
      if (profileData?.role) {
        setUserRole(profileData.role);
        localStorage.setItem('userRole', profileData.role);
      }
      
      // Also check creator_team_members for associations
      if (!hasCreatorRole) {
        const { data: teamMemberData } = await supabase
          .from('creator_team_members')
          .select('creator_id')
          .eq('team_member_id', userId)
          .limit(1);
        
        if (teamMemberData && teamMemberData.length > 0) {
          // If user is directly associated with a creator but doesn't have Creator role,
          // keep the creatorId but don't set isCreator
          setCreatorId(teamMemberData[0].creator_id);
          localStorage.setItem('creatorId', teamMemberData[0].creator_id);
        } else {
          // Only reset these if user isn't a creator by role
          setCreatorId(null);
          localStorage.removeItem('creatorId');
        }
      }
    } catch (error) {
      console.error('Error checking creator status:', error);
    }
  };

  // Helper function to ensure creator record exists in database
  const ensureCreatorRecord = async (userId: string) => {
    try {
      // Check if creator record exists
      const { data: existingCreator } = await supabase
        .from('creators')
        .select('id, needs_review')
        .eq('id', userId)
        .maybeSingle();
      
      if (!existingCreator) {
        console.log("Creating creator record for user:", userId);
        
        // Get user profile data
        const { data: userData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();
          
        if (userData) {
          // Create creator record - automatically approved
          await supabase
            .from('creators')
            .insert({
              id: userId,
              name: userData.name,
              gender: 'Male', // Default value required
              team: 'A Team', // Default value required
              creator_type: 'Real', // Default value required
              needs_review: false // Automatically approved
            });
          
          // Create empty social links record
          await supabase
            .from('creator_social_links')
            .insert({
              creator_id: userId
            });
        }
      } else if (existingCreator.needs_review) {
        // If creator exists but needs review, automatically approve them
        await supabase
          .from('creators')
          .update({ needs_review: false })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error ensuring creator record exists:', error);
    }
  };

  // Helper function to update credentials - Updated to return Promise<boolean>
  const updateCredentials = async (credentials: { 
    email?: string; 
    password?: string;
    currentPassword?: string;
    displayName?: string;
    profileImage?: string;
  }): Promise<boolean> => {
    try {
      // Build update object based on provided credentials
      const updateData: { email?: string; password?: string; data?: Record<string, any> } = {};
      if (credentials.email) updateData.email = credentials.email;
      if (credentials.password) updateData.password = credentials.password;
      
      // Add user metadata updates if provided
      if (credentials.displayName || credentials.profileImage) {
        updateData.data = {};
        
        if (credentials.displayName) {
          updateData.data.name = credentials.displayName;
        }
        
        if (credentials.profileImage) {
          updateData.data.avatar_url = credentials.profileImage;
        }
      }
      
      // Update auth credentials
      const { error } = await supabase.auth.updateUser(updateData);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your account has been updated",
      });
      
      if (credentials.email) {
        toast({
          title: "Email Verification",
          description: "Please check your email to verify the new address",
        });
      }
      
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return false;
    }
  };

  // Helper function to get pending users
  const fetchPendingUsers = async () => {
    // This is a placeholder - implement if needed
    return [];
  };

  // Helper function to approve pending users
  const approvePendingUser = async (userId: string, approved: boolean) => {
    // This is a placeholder - implement if needed
  };

  // Helper function to create team members - Updated to use primary_role and additional_roles parameters
  const createTeamMember = async (data: { 
    username: string; 
    email: string; 
    role: string;
  }): Promise<boolean> => {
    try {
      // Use the default password "XentrikBananas"
      const defaultPassword = "XentrikBananas";
      
      // Call the create_team_member function with proper parameter names
      const { data: newUser, error } = await supabase.rpc(
        'create_team_member',
        { 
          email: data.email, 
          password: defaultPassword,
          name: data.username,
          primary_role: data.role,
          additional_roles: []
        }
      );
      
      if (error) {
        throw error;
      }
      
      console.log("Team member created with ID:", newUser);
      return true;
    } catch (error: any) {
      console.error("Error creating team member:", error);
      toast({
        variant: "destructive",
        title: "Failed to create team member",
        description: error.message || "An unknown error occurred"
      });
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting signOut process");
      
      // Clear local state first before API call to ensure UI updates immediately
      localStorage.removeItem('isCreator');
      localStorage.removeItem('creatorId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('lastVisitedRoute');
      setIsCreator(false);
      setCreatorId(null);
      setUserRole('Employee');
      setUserRoles([]);
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      
      console.log("Local state cleared, now calling Supabase signOut");
      
      // Force signOut which will invalidate all sessions
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          console.error("Supabase signOut error:", error);
        }
      } catch (error) {
        console.error("Error during signOut API call:", error);
        // Continue with logout flow even if the API call fails
      }
      
      console.log("Supabase signOut completed, redirecting to login");
      
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out",
      });
      
      // Always force navigation to login page regardless of API call success
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 0);
      
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "Auth session missing!",
      });
      
      // Even with an error, redirect to login
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 0);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event, !!currentSession);
      setIsAuthenticated(!!currentSession);
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Check creator status when session changes
        const storedIsCreator = localStorage.getItem('isCreator');
        const storedCreatorId = localStorage.getItem('creatorId');
        const storedUserRole = localStorage.getItem('userRole');
        const storedUserRoles = localStorage.getItem('userRoles');
        
        if (storedIsCreator === 'true') {
          setIsCreator(true);
        }
        
        if (storedCreatorId) {
          setCreatorId(storedCreatorId);
        }
        
        if (storedUserRole) {
          setUserRole(storedUserRole);
        }
        
        if (storedUserRoles) {
          try {
            const parsedRoles = JSON.parse(storedUserRoles);
            if (Array.isArray(parsedRoles)) {
              setUserRoles(parsedRoles);
            }
          } catch (e) {
            console.error('Error parsing stored user roles:', e);
            setUserRoles([]);
          }
        }
        
        // Check for updated status only once, without setTimeout
        checkCreatorStatus(currentSession.user.id);
      }
      
      if (event === 'SIGNED_OUT') {
        navigate('/login');
        // Clear stored values on sign out
        localStorage.removeItem('isCreator');
        localStorage.removeItem('creatorId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoles');
        setIsCreator(false);
        setCreatorId(null);
        setUserRole('Employee');
        setUserRoles([]);
      } else if (event === 'SIGNED_IN') {
        // CRITICAL: Only redirect if this tab explicitly initiated a login action
        // We use sessionStorage (tab-specific) to track this - set by signInWithEmail/signInWithOAuth
        const pendingLoginRedirect = sessionStorage.getItem('pendingLoginRedirect');
        
        if (pendingLoginRedirect === 'true') {
          // Clear the flag immediately to prevent re-triggering on subsequent auth events
          sessionStorage.removeItem('pendingLoginRedirect');
          
          // Redirect to last visited route or dashboard
          const lastVisitedRoute = localStorage.getItem('lastVisitedRoute');
          console.log("Explicit sign-in detected, redirecting to:", lastVisitedRoute || '/dashboard');
          navigate(lastVisitedRoute || '/dashboard');
        } else {
          // This is session recovery (page load, tab focus, token refresh) - do NOT redirect
          console.log("Session recovered/refreshed, staying on current route");
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery redirect
        navigate('/reset-password');
      }
      
      setIsLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", !!currentSession);
      setIsAuthenticated(!!currentSession);
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Check creator status for existing session only once
        checkCreatorStatus(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Mark that this tab is explicitly logging in - used by auth listener to know whether to redirect
      sessionStorage.setItem('pendingLoginRedirect', 'true');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Clear the flag if login failed
        sessionStorage.removeItem('pendingLoginRedirect');
        throw error;
      }
    } catch (error: any) {
      sessionStorage.removeItem('pendingLoginRedirect');
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      throw error;
    }
  };

  const signInWithOAuth = async (provider: 'google') => {
    try {
      // Mark that this tab is explicitly logging in - used by auth listener to know whether to redirect
      sessionStorage.setItem('pendingLoginRedirect', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
      });

      if (error) {
        // Clear the flag if login failed
        sessionStorage.removeItem('pendingLoginRedirect');
        throw error;
      }
    } catch (error: any) {
      sessionStorage.removeItem('pendingLoginRedirect');
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        session,
        isCreator,
        creatorId,
        userRole,
        userRoles,
        signInWithEmail,
        signInWithOAuth,
        signOut,
        updateCredentials,
        pendingUsers: [],
        approvePendingUser,
        createTeamMember
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};
