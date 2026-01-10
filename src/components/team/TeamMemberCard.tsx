
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  Clock, 
  MessageSquare,
  Phone,
  Pencil,
  UserCog,
  Shield
} from 'lucide-react';
import { TeamMember } from '@/types/team';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';

interface TeamMemberCardProps {
  teamMember: TeamMember;
  onEditClick: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  teamMember,
  onEditClick
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-red-500';
      case 'Paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const isCurrentUser = user?.id === teamMember.id;

  return (
    <Card className="overflow-hidden flex flex-col h-full rounded-lg border border-border bg-card hover:bg-muted/50 shadow-md">
      <div className="p-6 flex-grow space-y-6">
        {/* Header with status and badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(teamMember.status)}`} />
            <span className="text-sm text-muted-foreground">{teamMember.status}</span>
          </div>
          
          {teamMember.roles?.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {teamMember.roles.map(role => (
                <Badge 
                  key={role} 
                  variant="outline" 
                  className={
                    role === 'Manager' ? 'bg-blue-500/10 text-blue-400' :
                    role === 'Admin' ? 'bg-red-500/10 text-red-400' :
                    'bg-primary/10 text-primary/80'
                  }
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Profile image and name */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={teamMember.profileImage} alt={teamMember.name} />
            <AvatarFallback className="text-lg bg-primary/20 text-primary">
              {getInitials(teamMember.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold">
            {teamMember.name}
            {isCurrentUser && <span className="ml-2 text-muted-foreground text-sm font-normal">(me)</span>}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>{teamMember.email}</span>
          </div>
        </div>
        
        {/* Info sections */}
        <div className="space-y-3">
          {/* Last login time */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Last login:</span>
            </div>
            <span className="text-sm">{teamMember.lastLogin || 'Never'}</span>
          </div>
          
          {/* Teams */}
          {teamMember.teams && teamMember.teams.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Teams:</span>
              </div>
              <div className="flex gap-1">
                {teamMember.teams.map(team => (
                  <Badge key={team} variant="outline" className="bg-primary/5">
                    Team {team}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Contact info */}
          {(teamMember.telegram || teamMember.phoneNumber) && (
            <div className="flex flex-col gap-2 pt-2">
              {teamMember.telegram && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">@{teamMember.telegram}</span>
                </div>
              )}
              
              {teamMember.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{teamMember.phoneNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-0 border-t border-border">
        <div className="grid grid-cols-2 divide-x divide-border">
          <Button 
            variant="ghost" 
            className="rounded-none py-3 text-primary/80 hover:text-primary hover:bg-background/10"
            onClick={() => navigate(`/team/${teamMember.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="ghost" 
            className="rounded-none py-3 text-primary/80 hover:text-primary hover:bg-background/10"
            onClick={() => navigate(`/team/${teamMember.id}`)}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;
