import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

const SidebarUserSection: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useSupabaseAuth();
  const { setTheme, theme } = useTheme();

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from sidebar");
      await signOut();
      // No need to add navigation here as it's already in the signOut function
    } catch (error) {
      console.error("Error in handleLogout:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again."
      });
      
      // Force navigation to login page even if there's an error
      navigate('/login', { replace: true });
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
          <div className="rounded-xl cursor-pointer transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5">
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || "User"} />
                <AvatarFallback className="bg-primary/20 text-primary">{getUserInitials()}</AvatarFallback>
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
        
        <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
          <DropdownMenuItem 
            onClick={() => navigate('/account')}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              {theme === 'dark' ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === 'light' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-card border-border shadow-lg">
              <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={`cursor-pointer ${theme === 'light' ? 'bg-primary/20' : ''}`}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={`cursor-pointer ${theme === 'dark' ? 'bg-primary/20' : ''}`}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={`cursor-pointer ${theme === 'system' ? 'bg-primary/20' : ''}`}
              >
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator className="bg-border/20" />
          
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
