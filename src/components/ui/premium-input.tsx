
import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PremiumInput: React.FC<PremiumInputProps> = ({ 
  className, 
  ...props 
}) => {
  return (
    <Input
      className={cn(
        "bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
};

export default PremiumInput;
