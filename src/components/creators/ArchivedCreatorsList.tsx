import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCreators } from '@/context/creator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArchiveRestore, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArchivedCreator {
  id: string;
  name: string;
  model_name: string | null;
  email: string | null;
  team: string;
  gender: string;
  creator_type: string;
  updated_at: string | null;
}

export const ArchivedCreatorsList: React.FC = () => {
  const [archived, setArchived] = useState<ArchivedCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { restoreCreator } = useCreators();
  const { toast } = useToast();

  const fetchArchived = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('creators')
      .select('id, name, model_name, email, team, gender, creator_type, updated_at')
      .eq('active', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching archived creators:', error);
      toast({ title: 'Error', description: 'Failed to load archived models', variant: 'destructive' });
    } else {
      setArchived(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    const success = await restoreCreator(id);
    if (success) {
      setArchived(prev => prev.filter(c => c.id !== id));
    }
    setRestoringId(null);
  };

  const filtered = archived.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.model_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (archived.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No archived models found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search archived models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Model Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((creator) => (
              <tr key={creator.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">{creator.model_name || '—'}</td>
                <td className="px-4 py-3">{creator.name}</td>
                <td className="px-4 py-3">{creator.team}</td>
                <td className="px-4 py-3">{creator.creator_type}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(creator.id)}
                    disabled={restoringId === creator.id}
                    className="gap-1.5"
                  >
                    {restoringId === creator.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    )}
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && search && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No archived models match "{search}"
        </div>
      )}
    </div>
  );
};
