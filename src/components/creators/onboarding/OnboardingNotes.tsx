
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingFormValues } from "./OnboardingForm";

interface OnboardingNotesProps {
  control: Control<OnboardingFormValues>;
}

const OnboardingNotes: React.FC<OnboardingNotesProps> = ({ control }) => {
  return (
    <div className="bg-[#1a1a33] text-card-foreground rounded-lg border border-[#252538] shadow-sm p-6 space-y-6">
      <h2 className="text-lg font-semibold">Additional Notes</h2>
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea 
                placeholder="Add any additional notes about this creator" 
                className="min-h-[120px]" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default OnboardingNotes;
