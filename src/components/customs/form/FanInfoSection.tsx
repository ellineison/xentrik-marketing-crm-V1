
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FanInfoSectionProps {
  formData: {
    fan_display_name: string;
    fan_username: string;
    description: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const FanInfoSection: React.FC<FanInfoSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fan_display_name">Fan Display Name *</Label>
          <Input
            id="fan_display_name"
            value={formData.fan_display_name}
            onChange={(e) => onInputChange('fan_display_name', e.target.value)}
            placeholder="Fan's display name (emojis supported 🎉)"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="fan_username">Fan Username</Label>
          <Input
            id="fan_username"
            value={formData.fan_username}
            onChange={(e) => onInputChange('fan_username', e.target.value)}
            placeholder="@username (emojis supported 😊)"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Custom description (emojis supported 💝)"
          rows={3}
          required
        />
      </div>
    </>
  );
};

export default FanInfoSection;
