
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatorOnboardingFormValues } from "@/schemas/creatorOnboardingSchema";
import { Plus, Trash } from "lucide-react";

const PetsSection: React.FC = () => {
  const { control, watch, setValue } = useFormContext<CreatorOnboardingFormValues>();
  
  const hasPets = watch("personalInfo.hasPets");
  const pets = watch("personalInfo.pets") || [];
  
  const addPet = () => {
    setValue("personalInfo.pets", [
      ...(pets || []),
      { type: "", breed: "", age: "", name: "" }
    ]);
  };
  
  const removePet = (index: number) => {
    setValue(
      "personalInfo.pets",
      pets.filter((_, i) => i !== index)
    );
  };
  
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="personalInfo.hasPets"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox 
                checked={field.value} 
                onCheckedChange={field.onChange} 
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Do you have pets?</FormLabel>
            </div>
          </FormItem>
        )}
      />
      
      {hasPets && (
        <div className="space-y-4 mt-2 pl-7">
          {pets.map((_, index) => (
            <div key={index} className="p-4 border border-border rounded-md bg-muted/30">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Pet #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePet(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`personalInfo.pets.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dog, Cat, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`personalInfo.pets.${index}.breed`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Breed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`personalInfo.pets.${index}.age`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Age" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`personalInfo.pets.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPet}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Pet
          </Button>
        </div>
      )}
    </div>
  );
};

export default PetsSection;
