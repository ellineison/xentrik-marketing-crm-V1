
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
    <div className="rounded-xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm p-6 border border-border/50 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Additional Notes</h2>
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
