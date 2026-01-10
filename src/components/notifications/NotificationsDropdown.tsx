
import React from 'react';
import { Bell, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const NotificationsDropdown = () => {
  // This would come from a notifications context/state later
  const hasUnreadNotifications = false;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:bg-gradient-premium-yellow hover:text-black transition-all duration-300"
        >
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-card border border-border"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs hover:bg-muted"
          >
            Clear all
          </Button>
        </div>
        
        <div className="py-2">
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No notifications
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
