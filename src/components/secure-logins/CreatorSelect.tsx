
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserCircle, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Creator } from '../../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreatorSelectProps {
  creators: Creator[];
  selectedCreator: Creator | null;
  onSelectCreator: (creatorId: string) => void;
}

const CreatorSelect: React.FC<CreatorSelectProps> = ({ 
  creators, 
  selectedCreator, 
  onSelectCreator 
}) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort creators based on search query
  const filteredCreators = useMemo(() => {
    let filtered = creators;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = creators.filter(creator => {
        const modelName = creator.modelName?.toLowerCase() || '';
        const name = creator.name?.toLowerCase() || '';
        return modelName.includes(query) || name.includes(query);
      });
    }
    
    // Sort alphabetically by model name or name
    return filtered.sort((a, b) => {
      const aName = (a.modelName || a.name).toLowerCase();
      const bName = (b.modelName || b.name).toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [creators, searchQuery]);

  return (
    <Card className={isMobile ? 'w-full' : 'h-[calc(100vh-12rem)]'}>
      <CardHeader className={isMobile ? 'pb-4' : ''}>
        <CardTitle className={isMobile ? 'text-lg' : ''}>Models</CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>
          Select a model to manage login details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-[15px]"
          />
        </div>

        {/* Creator List */}
        <ScrollArea className={isMobile ? 'h-[400px]' : 'h-[calc(100vh-24rem)]'}>
          <div className="space-y-2 pr-4">
            {filteredCreators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No models found
              </div>
            ) : (
              filteredCreators.map(creator => (
                <button
                  key={creator.id}
                  onClick={() => onSelectCreator(creator.id)}
                  className={`
                    w-full text-left p-3 rounded-[15px] transition-all
                    flex items-center gap-3
                    ${selectedCreator?.id === creator.id 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted/50 bg-background border border-border'
                    }
                  `}
                >
                  <UserCircle className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                  <span className={`truncate ${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                    {creator.modelName || creator.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CreatorSelect;
