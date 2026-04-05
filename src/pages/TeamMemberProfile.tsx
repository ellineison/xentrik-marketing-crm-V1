
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTeam } from "@/context/TeamContext";
import { useToast } from "@/hooks/use-toast";
import { TeamMember } from "@/types/team";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, User, Mail, MessageSquare, Phone, Building, Users, Shield, Clock } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import ProfileImageUploader from "@/components/team/ProfileImageUploader";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  roles: z.array(z.string()).min(1, { message: "Select at least one role" }),
  status: z.enum(["Active", "Inactive", "Paused"]),
  teams: z.array(z.string()).optional(),
  department: z.string().optional(),
  telegram: z.string().optional(),
  phoneNumber: z.string().optional(),
  profileImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TeamMemberProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { teamMembers, loading } = useTeam();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      roles: [],
      status: "Active",
      teams: [],
      department: "",
      telegram: "",
      phoneNumber: "",
      profileImage: "",
    },
  });
  
  // Find the team member by ID
  useEffect(() => {
    if (teamMembers.length > 0 && id) {
      const member = teamMembers.find(m => m.id === id);
      if (member) {
        setTeamMember(member);
        form.reset({
          name: member.name,
          email: member.email,
          roles: member.roles || [],
          status: member.status,
          teams: member.teams || [],
          department: member.department || "",
          telegram: member.telegram || "",
          phoneNumber: member.phoneNumber || "",
          profileImage: member.profileImage || "",
        });
      } else {
        toast({
          title: "Not Found",
          description: "Team member not found",
          variant: "destructive"
        });
        navigate('/team');
      }
    }
  }, [teamMembers, id, form, navigate, toast]);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500 text-green-50';
      case 'Inactive': return 'bg-red-500 text-red-50';
      case 'Paused': return 'bg-yellow-500 text-yellow-50';
      default: return 'bg-gray-500 text-gray-50';
    }
  };
  
  if (loading || !teamMember) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/team')}
            className="rounded-full p-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
        
        <div className="flex justify-center items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-primary-foreground"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/team')}
          className="rounded-full p-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">{teamMember.name}</h1>
        <Badge className={getStatusColor(teamMember.status)}>
          {teamMember.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teamMember.profileImage} alt={teamMember.name} />
                <AvatarFallback className="text-lg bg-primary/20 text-primary">
                  {getInitials(teamMember.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{teamMember.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 mt-1">
              <Mail className="h-3.5 w-3.5" />
              <span>{teamMember.email}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {teamMember.roles && teamMember.roles.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-center">
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
            
            <div className="pt-2 space-y-3">
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
              
              {/* Department */}
              {teamMember.department && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">Department:</span>
                  </div>
                  <span className="text-sm">{teamMember.department}</span>
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            {(teamMember.telegram || teamMember.phoneNumber) && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <h3 className="text-sm font-medium">Contact Information</h3>
                
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
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={() => navigate(`/team/${teamMember.id}/edit`)}
              className="w-full text-black rounded-[15px] px-4 py-2 transition-all hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5 hover:shadow-premium-yellow hover:opacity-90 bg-gradient-premium-yellow shadow-premium-yellow"
            >
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        {/* Additional Cards/Info here if needed */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>Recent activity and assignments</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* This is a placeholder for future functionality */}
              <p className="text-muted-foreground text-center py-8">
                Activity tracking coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamMemberProfile;
