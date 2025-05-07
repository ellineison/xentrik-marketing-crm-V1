
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

const SidebarUserSection: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useSupabaseAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out"
      });
      
      // Manually navigate to login page after successful logout
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 300);
      
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again."
      });
    }
  };

  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="px-2 mt-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="rounded-xl cursor-pointer transition-all duration-300 hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5">
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8 border border-black/10">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || "User"} />
                <AvatarFallback className="bg-yellow-200 text-black">{getUserInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 flex flex-col text-left min-w-0">
                <span className="font-medium text-sm truncate max-w-[120px]">
                  {user.email}
                </span>
                <span className="text-xs opacity-70">
                  User
                </span>
              </div>
              
              <ChevronDown className="h-4 w-4 opacity-70" />
            </div>
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 bg-premium-card border-premium-border shadow-premium-md">
          <DropdownMenuItem 
            onClick={() => navigate('/account')}
            className="cursor-pointer hover:bg-gradient-premium-yellow hover:text-black"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-premium-border/20" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-600" />
            <span className="text-red-600">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserSection;
