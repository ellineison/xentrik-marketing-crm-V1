
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Employee, EmployeeStatus, PrimaryRole } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";

export const useUserRoles = () => {
  const [users, setUsers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'delete' | null>(null);
  const { toast } = useToast();

  // Sort users by role priority: Admin > Manager > Employee
  const sortUsersByRole = (users: Employee[]): Employee[] => {
    const rolePriority: Record<PrimaryRole, number> = {
      "Admin": 0,
      "Manager": 1,
      "Employee": 2
    };

    return [...users].sort((a, b) => {
      // Sort by role priority first
      return rolePriority[a.role] - rolePriority[b.role];
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users from Supabase profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        // Map the data to match our Employee type with proper type casting
        const formattedUsers = data.map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as PrimaryRole,
          roles: profile.roles as string[] || [],
          status: (profile.status || "Active") as EmployeeStatus,
          profileImage: profile.profile_image,
          lastLogin: profile.last_login ? new Date(profile.last_login).toLocaleString() : "Never",
          createdAt: profile.created_at ? new Date(profile.created_at).toLocaleString() : "Unknown",
          department: profile.department,
          telegram: profile.telegram
        }));
        
        // Sort users by role
        const sortedUsers = sortUsersByRole(formattedUsers);
        
        console.log("Fetched users:", sortedUsers);
        setUsers(sortedUsers);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: Employee) => {
    console.log("Editing user:", user);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSuspend = (user: Employee) => {
    setSelectedUser(user);
    setPendingAction('suspend');
    setIsActionDialogOpen(true);
  };

  const handleDelete = (user: Employee) => {
    setSelectedUser(user);
    setPendingAction('delete');
    setIsActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !pendingAction) return;

    try {
      setLoading(true);
      
      if (pendingAction === 'suspend') {
        // Update user status to Suspended
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'Suspended' })
          .eq('id', selectedUser.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${selectedUser.name} has been suspended`,
        });
      } else if (pendingAction === 'delete') {
        // Call the edge function to delete the user
        const { error } = await supabase.functions.invoke('delete-team-member', {
          body: { userId: selectedUser.id }
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `${selectedUser.name} has been permanently deleted`,
        });
      }

      // Refresh the users list
      await fetchUsers();
      
    } catch (error) {
      console.error(`Error ${pendingAction}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${pendingAction} user`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsActionDialogOpen(false);
      setPendingAction(null);
      setSelectedUser(null);
    }
  };

  return {
    users,
    loading,
    selectedUser,
    setSelectedUser,
    isModalOpen,
    setIsModalOpen,
    isActionDialogOpen,
    setIsActionDialogOpen,
    pendingAction,
    fetchUsers,
    handleEdit,
    handleSuspend,
    handleDelete,
    handleConfirmAction
  };
};

export default useUserRoles;
