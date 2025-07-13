
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import CreatorDataModal from './CreatorDataModal';
import { getTimezoneFromLocationName } from '@/utils/timezoneUtils';
import { shouldFilterCreator } from '@/utils/geographicFiltering';
import { useAuth } from '@/context/AuthContext';

interface CreatorSubmission {
  id: string;
  name: string;
  email: string;
  submitted_at: string;
  data: any;
  token: string;
}

interface CreatorWithTimezone extends CreatorSubmission {
  timezone?: string;
}

const CreatorsDataTable: React.FC = () => {
  const { userRole, userRoles, user } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<CreatorWithTimezone | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatorsWithTimezones, setCreatorsWithTimezones] = useState<CreatorWithTimezone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userGeographicRestrictions, setUserGeographicRestrictions] = useState<string[]>([]);

  // Check if user is a Chatter (hide sensitive info like email)
  const isChatter = userRole === 'Chatter' || userRoles?.includes('Chatter');

  // Fetch user's geographic restrictions
  useEffect(() => {
    const fetchUserRestrictions = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('geographic_restrictions')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setUserGeographicRestrictions(data.geographic_restrictions || []);
        }
      }
    };

    fetchUserRestrictions();
  }, [user?.id]);

  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['accepted-creator-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .eq('status', 'accepted')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching accepted submissions:', error);
        throw error;
      }

      return data as CreatorSubmission[];
    },
  });

  // Preload timezone data for all creators and apply geographic filtering
  useEffect(() => {
    if (submissions.length > 0) {
      const processTimezones = async () => {
        const processedCreators = submissions
          .filter((submission) => {
            // Apply geographic filtering
            return !shouldFilterCreator(submission, userGeographicRestrictions);
          })
          .map((submission) => {
            const location = submission.data?.personalInfo?.location;
            let timezone = null;
            
            if (location) {
              timezone = getTimezoneFromLocationName(location);
              console.log('Preloaded timezone for', submission.name, ':', timezone);
            }
            
            return {
              ...submission,
              timezone
            };
          });
        
        setCreatorsWithTimezones(processedCreators);
      };

      processTimezones();
    }
  }, [submissions, userGeographicRestrictions]);

  // Filter creators based on search query
  const filteredCreators = creatorsWithTimezones.filter((submission) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const matchName = submission.name.toLowerCase().includes(query);
    const matchEmail = !isChatter && submission.email.toLowerCase().includes(query);
    
    return matchName || matchEmail;
  });

  const handleDataUpdate = (updatedSubmission: CreatorSubmission) => {
    // Refresh the table data after successful update
    refetch();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleViewData = (submission: CreatorWithTimezone) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading creator data...</div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Data Available</h3>
          <p className="text-sm text-muted-foreground">No accepted creator submissions found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search creators by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile Card Layout - Visible only on mobile */}
      <div className="block md:hidden space-y-3">
        {filteredCreators.map((submission) => (
          <div key={submission.id} className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-medium text-base text-foreground truncate mb-1">
                  {submission.name}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewData(submission)}
                className="ml-3 h-9 px-3 text-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Data
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout - Hidden on mobile */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Name</TableHead>
              {!isChatter && <TableHead className="text-left">Email</TableHead>}
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCreators.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium text-left">{submission.name}</TableCell>
                {!isChatter && <TableCell className="text-left">{submission.email}</TableCell>}
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewData(submission)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Data
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCreators.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No creators found matching "{searchQuery}"</p>
        </div>
      )}

      <CreatorDataModal
        submission={selectedSubmission}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onDataUpdate={handleDataUpdate}
      />
    </>
  );
};

export default CreatorsDataTable;
