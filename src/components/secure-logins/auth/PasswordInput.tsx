
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  password: string;
  setPassword: (password: string) => void;
  error?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ 
  password, 
  setPassword, 
  error 
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
      <Input 
        id="password"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={cn(
          "rounded-xl bg-muted border-border focus:border-primary transition-all duration-300 hover:opacity-90",
          error ? 'border-red-500 focus:border-red-500' : ''
        )}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;
