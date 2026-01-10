
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OnboardingFormValues } from "./OnboardingForm";
import CountryCodeSelector from "@/components/ui/country-code-selector";

interface OnboardingContactInfoProps {
  control: Control<OnboardingFormValues>;
}

const OnboardingContactInfo: React.FC<OnboardingContactInfoProps> = ({ control }) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm p-6 border border-border/50 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Contact Information</h2>
      <div className="grid gap-4">
        <FormField
          control={control}
          name="telegramUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input 
                    className="pl-7" 
                    placeholder="username" 
                    {...field} 
                    value={field.value?.startsWith('@') ? field.value.substring(1) : field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value.startsWith('@') ? value : '@' + value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="whatsappNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp Number</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <CountryCodeSelector 
                    value={field.value?.split(' ')[0] || "+1"} 
                    onChange={(code) => {
                      const number = field.value?.split(' ')[1] || '';
                      field.onChange(`${code} ${number}`);
                    }} 
                  />
                  <Input 
                    className="flex-1" 
                    placeholder="123456789" 
                    value={field.value?.split(' ')[1] || ''}
                    onChange={(e) => {
                      const code = field.value?.split(' ')[0] || "+1";
                      const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(`${code} ${onlyNumbers}`);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default OnboardingContactInfo;
