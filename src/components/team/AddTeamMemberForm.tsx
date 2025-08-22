
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define available role types
const PRIMARY_ROLES = ["Admin", "Manager", "Employee"];
const ADDITIONAL_ROLES = ["Admin", "VA", "Chatter", "Developer", "HR / Work Force"];

interface FormState {
  name: string;
  email: string;
  primaryRole: string;
  additionalRoles: string[];
}

const defaultForm: FormState = {
  name: "",
  email: "",
  primaryRole: "Employee",
  additionalRoles: [],
};

const AddTeamMemberForm = () => {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createTeamMember } = useSupabaseAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePrimaryRoleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      primaryRole: value,
    }));
  };

  const handleAdditionalRoleToggle = (role: string) => {
    setForm((prev) => {
      // If Creator is selected, clear all other roles (Creator is exclusive)
      if (role === "Creator") {
        return {
          ...prev,
          additionalRoles: prev.additionalRoles.includes("Creator") ? [] : ["Creator"],
        };
      }
      
      // If trying to add a non-Creator role but Creator is already selected, don't allow it
      if (prev.additionalRoles.includes("Creator")) {
        toast({
          title: "Cannot combine roles",
          description: "Creator cannot be combined with other roles",
          variant: "destructive",
        });
        return prev;
      }
      
      // Toggle the role normally
      const updatedRoles = prev.additionalRoles.includes(role)
        ? prev.additionalRoles.filter(r => r !== role)
        : [...prev.additionalRoles, role];
        
      return {
        ...prev,
        additionalRoles: updatedRoles,
      };
    });
  };

  const handleCancel = () => {
    navigate("/team");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!form.name || !form.email) {
        toast({
          title: "Missing information",
          description: "Please provide name and email address.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the final roles to use
      const rolesToUse = form.additionalRoles.includes("Creator") 
        ? ["Creator"] 
        : form.additionalRoles;
      
      // Create the team member with default password
      const result = await createTeamMember({
        username: form.name,
        email: form.email,
        role: form.primaryRole,
      });

      if (result) {
        toast({
          title: "Team member added",
          description: `${form.name} has been added to the team with the default password.`,
        });
        setForm(defaultForm);
        navigate("/team");
      } else {
        throw new Error("Failed to create team member");
      }
    } catch (error) {
      console.error("Error creating team member:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if Creator is selected (Creator is exclusive)
  const isCreatorSelected = form.additionalRoles.includes("Creator");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="bg-[#1a1a33]/50 p-6 rounded-xl border border-[#252538]/50">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Default Password</Label>
                <Input
                  value="XentrikBananas"
                  readOnly
                  disabled
                  className="mt-1 bg-gray-800/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is the default password that will be assigned to the new team member
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a33]/50 p-6 rounded-xl border border-[#252538]/50">
            <h2 className="text-xl font-semibold mb-4">Primary Role</h2>
            
            <RadioGroup 
              value={form.primaryRole}
              onValueChange={handlePrimaryRoleChange}
              className="space-y-3"
            >
              {PRIMARY_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={`role-${role}`} />
                  <Label htmlFor={`role-${role}`}>{role}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="bg-[#1a1a33]/50 p-6 rounded-xl border border-[#252538]/50">
            <h2 className="text-xl font-semibold mb-4">Additional Roles</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Creator is an exclusive role and cannot be combined with other roles
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {ADDITIONAL_ROLES.map((role) => (
                <div 
                  key={role} 
                  className="flex items-center space-x-2 rounded-md border p-3"
                >
                  <Checkbox
                    id={`role-additional-${role}`}
                    checked={form.additionalRoles.includes(role)}
                    onCheckedChange={() => handleAdditionalRoleToggle(role)}
                    disabled={isCreatorSelected && role !== "Creator"}
                  />
                  <Label 
                    htmlFor={`role-additional-${role}`}
                    className="font-normal cursor-pointer"
                  >
                    {role}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="text-black rounded-[15px] px-6 py-2 transition-all hover:bg-gradient-premium-yellow hover:text-black hover:-translate-y-0.5 hover:shadow-premium-yellow hover:opacity-90 bg-gradient-premium-yellow shadow-premium-yellow"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Add Team Member
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddTeamMemberForm;
