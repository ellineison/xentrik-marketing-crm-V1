
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control } from "react-hook-form";
import { TeamMemberFormValues } from "@/schemas/teamMemberSchema";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Props for the direct form approach
interface Props {
  form: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    telegram: string;
    phoneNumber: string;
    department: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Props for react-hook-form integration
interface FormProps {
  control: Control<TeamMemberFormValues>;
  isCurrentUser: boolean;
}

// Create a union type to support both approaches
type BasicInfoSectionProps = Props | FormProps;

const BasicInfoSection: React.FC<BasicInfoSectionProps> = (props) => {
  // Check which props version we're dealing with
  if ('control' in props) {
    // React Hook Form version
    const { control, isCurrentUser } = props;
    
    return (
      <div className="bg-card/50 p-6 rounded-xl border border-border/50">
        <h2 className="text-xl font-bold mb-6 text-foreground">Basic Information</h2>
        <div className="space-y-4">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john.doe@example.com"
                    className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!isCurrentUser && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Role</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 rounded bg-muted text-foreground border border-border"
                        {...field}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Status</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 rounded bg-muted text-foreground border border-border"
                        disabled={isCurrentUser}
                        {...field}
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Telegram</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username"
                      className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Marketing"
                      className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Original non-react-hook-form version
  const { form, onInputChange } = props;
  
  return (
    <div className="bg-card/50 p-6 rounded-xl border border-border/50">
      <h2 className="text-xl font-bold mb-6 text-foreground">Basic Information</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-foreground mb-1">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={onInputChange}
            placeholder="John Doe"
            className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
            autoFocus
            required
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-foreground mb-1">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onInputChange}
            placeholder="john.doe@example.com"
            className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password" className="text-foreground mb-1">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onInputChange}
              placeholder="********"
              className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-foreground mb-1">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onInputChange}
              placeholder="********"
              className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telegram" className="text-foreground mb-1">Telegram</Label>
            <Input
              id="telegram"
              name="telegram"
              value={form.telegram}
              onChange={onInputChange}
              placeholder="username"
              className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber" className="text-foreground mb-1">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={onInputChange}
              placeholder="+1234567890"
              className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="department" className="text-foreground mb-1">Department</Label>
          <Input
            id="department"
            name="department"
            value={form.department}
            onChange={onInputChange}
            placeholder="Marketing"
            className="bg-muted text-foreground border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
