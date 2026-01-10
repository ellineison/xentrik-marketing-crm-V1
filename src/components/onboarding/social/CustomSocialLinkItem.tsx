
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface CustomSocialLink {
  id: string;
  name: string;
  url: string;
}

interface CustomSocialLinkItemProps {
  link: CustomSocialLink;
  onUpdate: (id: string, url: string) => void;
  onRemove: (id: string) => void;
}

const CustomSocialLinkItem: React.FC<CustomSocialLinkItemProps> = ({
  link,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="relative space-y-2 p-3 bg-card/80 rounded-lg">
      <Label>{link.name}</Label>
      <div className="flex">
        <Input 
          value={link.url}
          onChange={(e) => onUpdate(link.id, e.target.value)}
          placeholder="URL"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="ml-1 text-red-400 hover:text-red-500"
          onClick={() => onRemove(link.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CustomSocialLinkItem;
