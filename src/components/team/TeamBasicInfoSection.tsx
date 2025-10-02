

import React from 'react';
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamMemberFormValues } from '@/schemas/teamMemberSchema';

interface TeamBasicInfoSectionProps {
  control: Control<TeamMemberFormValues>;
}

const TeamBasicInfoSection: React.FC<TeamBasicInfoSectionProps> = ({ control }) => {
  return (
    <div className="bg-[#1a1a33]/50 backdrop-blur-sm p-6 rounded-xl border border-[#252538]/50">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
      <div className="grid gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter team member name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="telegram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram Username</FormLabel>
              <FormControl>
                <Input placeholder="@username" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="6AM">6AM</SelectItem>
                  <SelectItem value="2PM">2PM</SelectItem>
                  <SelectItem value="10PM">10PM</SelectItem>
                  <SelectItem value="Social Media Team">Social Media Team</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default TeamBasicInfoSection;
