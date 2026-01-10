
import React from 'react';
import { Search, Filter, User, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { Recipient } from '@/types/message';

interface RecipientListProps {
  recipients: Recipient[];
  selectedRecipientIds: string[];
  onSelectRecipient: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const RecipientList: React.FC<RecipientListProps> = ({
  recipients,
  selectedRecipientIds,
  onSelectRecipient,
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange
}) => {
  // Filter tags for recipient types
  const recipientTypeTags = ["Team", "Creator"];
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <Card className="md:col-span-1 flex flex-col h-full bg-secondary/5 border-0 shadow-none">
      <CardHeader className="pb-2 space-y-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Recipients
        </CardTitle>
        <CardDescription>
          Select one or more recipients to send a WhatsApp message
        </CardDescription>
        
        {/* Filter by type */}
        <div className="mt-2">
          <div className="flex items-center mb-2">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipientTypeTags.map((tag) => (
              <Toggle
                key={tag}
                variant="premium"
                pressed={selectedTags.includes(tag)}
                onPressedChange={() => toggleTag(tag)}
                className={cn(
                  "rounded-full text-sm",
                  selectedTags.includes(tag) ? "bg-gradient-premium-yellow text-black" : ""
                )}
              >
                {tag}
              </Toggle>
            ))}
          </div>
        </div>
        
        {/* Search input */}
        <div className="relative mt-2">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipients..."
            className="pl-9 bg-secondary/5 border border-border/40 focus:border-primary/30 transition-all"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {selectedRecipientIds.length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {selectedRecipientIds.length} recipient{selectedRecipientIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-2 pb-0">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-1 px-1 py-2">
            {recipients.map((recipient) => {
              const isSelected = selectedRecipientIds.includes(recipient.id);
              return (
                <button
                  key={`recipient-${recipient.id}`}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-secondary text-foreground' 
                      : 'hover:bg-secondary/10'
                  }`}
                  onClick={() => onSelectRecipient(recipient.id)}
                >
                  <div className="relative">
                    <Avatar className="border border-border/40">
                      <AvatarImage src={recipient.profileImage || ""} alt={recipient.name} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{recipient.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground truncate">
                        {recipient.role || "Team Member"}
                      </p>
                      <Badge variant={recipient.type === 'creator' ? 'default' : 'secondary'} className="ml-1 text-xs">
                        {recipient.type === 'creator' ? 'Creator' : 'Team'}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecipientList;
