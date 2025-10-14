
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/ui/location-picker";
import PetsSection from './PetsSection';
import { CreatorOnboardingFormValues } from "@/schemas/creatorOnboardingSchema";

export const PersonalInfoForm = () => {
  const { control, watch, setValue } = useFormContext<CreatorOnboardingFormValues>();
  const hasPets = watch('personalInfo.hasPets');
  const hasKids = watch('personalInfo.hasKids');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormField
          control={control}
          name="personalInfo.fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.modelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Name</FormLabel>
              <FormControl>
                <Input placeholder="Your model/stage name" {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Preferred name" {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email address" {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="min-h-[44px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={18} 
                  max={100}
                  placeholder="Enter age"
                  {...field} 
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? '' : Number(value));
                  }}
                  value={field.value ?? ''}
                  className="min-h-[44px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex/Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Transgender">Transgender</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Location</FormLabel>
              <FormControl>
                <LocationPicker
                  value={field.value || ''}
                  onChange={(location) => field.onChange(location)}
                  placeholder="Search for your current location..."
                  showCurrentTime={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.additionalLocationNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes about current Location</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes about your current location..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.hometown"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hometown</FormLabel>
              <FormControl>
                <LocationPicker
                  value={field.value || ''}
                  onChange={(location) => field.onChange(location)}
                  placeholder="Search for your hometown..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="personalInfo.ethnicity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ethnicity</FormLabel>
              <FormControl>
                <Input placeholder="Ethnicity" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.religion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Religion</FormLabel>
              <FormControl>
                <Input placeholder="Religion" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.relationshipStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Status</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Single, Married, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.handedness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handedness</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Left or Right handed" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.preferredFanNickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred nickname to fans (baby/love/darling/etc.)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. baby, love, darling" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.hasPets"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4 min-h-[44px]">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm sm:text-base">Do you have pets?</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {hasPets && <PetsSection />}

        <FormField
          control={control}
          name="personalInfo.hasKids"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4 min-h-[44px]">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm sm:text-base">Do you have kids?</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {hasKids && (
          <FormField
            control={control}
            name="personalInfo.numberOfKids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How many kids?</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name="personalInfo.occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What do you do for work?</FormLabel>
              <FormControl>
                <Input placeholder="Occupation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.workplace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where do you work?</FormLabel>
              <FormControl>
                <Input placeholder="Workplace" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalInfo.placesVisited"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Places/Countries you've visited (comma separated)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="E.g. France, Italy, Japan, 🇺🇸 USA, etc."
                  {...field}
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
