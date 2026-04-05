import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamMember } from '@/types/team';
import { TeamMemberRole } from '@/types/employee';
import ProfileImageUploader from './ProfileImageUploader';

interface EditTeamMemberModalProps {
  teamMember: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
}

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

const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({
  teamMember,
  open,
  onOpenChange,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
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
  
  // Update form values when teamMember changes
  useEffect(() => {
    if (teamMember && open) {
      form.reset({
        name: teamMember.name,
        email: teamMember.email,
        roles: teamMember.roles || [],
        status: teamMember.status,
        teams: teamMember.teams || [],
        department: teamMember.department || "",
        telegram: teamMember.telegram || "",
        phoneNumber: teamMember.phoneNumber || "",
        profileImage: teamMember.profileImage || "",
      });
    }
  }, [teamMember, form, open]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!teamMember) return;
    
    setIsSubmitting(true);
    
    try {
      await onUpdate(teamMember.id, {
        name: values.name,
        email: values.email,
        roles: values.roles as TeamMemberRole[],
        status: values.status,
        teams: values.teams as ("A" | "B" | "C")[],
        department: values.department,
        telegram: values.telegram,
        phoneNumber: values.phoneNumber,
        profileImage: values.profileImage,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating team member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const roleOptions: TeamMemberRole[] = [
    "Chatter", 
    "VA", 
    "Manager", 
    "Developer", 
    "Admin"
  ];
  
  // Use user-facing labels for the teams
  const teamOptions: { value: "A" | "B" | "C"; label: string }[] = [
    { value: "A", label: "A Team" },
    { value: "B", label: "B Team" },
    { value: "C", label: "C Team" },
  ];
  
  if (!teamMember) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl"> {/* make modal wider */}
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member information and permissions
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Paused">Paused</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Marketing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <ProfileImageUploader 
                          value={field.value} 
                          onChange={field.onChange}
                          name={form.watch("name")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="roles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {roleOptions.map((role) => (
                          <FormField
                            key={role}
                            control={form.control}
                            name="roles"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role)}
                                      onCheckedChange={(checked) => {
                                        const currentRoles = field.value || [];
                                        return checked
                                          ? field.onChange([...currentRoles, role])
                                          : field.onChange(
                                              currentRoles.filter((r) => r !== role)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {role}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="teams"
                  render={() => (
                    <FormItem>
                      <FormLabel>Teams</FormLabel>
                      <div className="flex gap-4 flex-row">
                        {teamOptions.map((team) => (
                          <FormField
                            key={team.value}
                            control={form.control}
                            name="teams"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={team.value}
                                  className="flex flex-row items-center space-x-2 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(team.value)}
                                      onCheckedChange={(checked) => {
                                        const currentTeams = field.value || [];
                                        return checked
                                          ? field.onChange([...currentTeams, team.value])
                                          : field.onChange(
                                              currentTeams.filter((t) => t !== team.value)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {team.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="text-black rounded-[15px] px-4 py-2 transition-all hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5 hover:shadow-premium-yellow hover:opacity-90 bg-gradient-premium-yellow shadow-premium-yellow"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamMemberModal;
