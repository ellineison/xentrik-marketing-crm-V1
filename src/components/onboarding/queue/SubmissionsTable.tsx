
import React, { useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Check, Loader2 } from "lucide-react";
import { OnboardSubmission } from "@/hooks/useOnboardingSubmissions";

interface SubmissionsTableProps {
  submissions: OnboardSubmission[];
  processingTokens: string[];
  formatDate: (dateString: string) => string;
  togglePreview: (token: string) => void;
  deleteSubmission: (token: string) => Promise<void>;
  onAcceptClick: (submission: OnboardSubmission) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  processingTokens,
  formatDate,
  togglePreview,
  deleteSubmission,
  onAcceptClick
}) => {
  // Track buttons that have been clicked to prevent double clicks
  const [clickedButtons, setClickedButtons] = React.useState<Record<string, boolean>>({});
  const [handlingTokens, setHandlingTokens] = React.useState<Set<string>>(new Set());
  
  // Use useMemo for derived state that depends on other state values
  const disabledTokens = useMemo(() => {
    const tokens = new Set<string>();
    
    // Add all processing tokens
    processingTokens.forEach(token => tokens.add(token));
    
    // Add all clicked buttons
    Object.entries(clickedButtons)
      .filter(([_, isClicked]) => isClicked)
      .forEach(([token]) => tokens.add(token));
    
    // Add all handling tokens
    handlingTokens.forEach(token => tokens.add(token));
    
    return tokens;
  }, [processingTokens, clickedButtons, handlingTokens]);

  // Formatting functions adapted from CreatorDataModal
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Not provided';
      return value.join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  // Updated field priority orders to match actual schema fields only
  const personalInfoPriority = [
    'fullName', 'nickname', 'age', 'dateOfBirth', 'location', 'hometown', 'ethnicity',
    // Logical ordering for remaining actual fields
    'email', 'sex', 'religion', 'relationshipStatus', 'handedness',
    'hasPets', 'pets', 'hasKids', 'numberOfKids', 'occupation', 'workplace', 'placesVisited'
  ];

  const physicalPriority = [
    'bodyType', 'height', 'weight', 'eyeColor',
    // Logical ordering for remaining actual fields
    'hairColor', 'favoriteColor', 'dislikedColor', 'allergies',
    'hasTattoos', 'tattooDetails', 'bustWaistHip', 'dickSize', 'isCircumcised', 'isTopOrBottom'
  ];

  const preferencesPriority = [
    'hobbies', 'favoriteFood', 'favoriteDrink', 'favoriteMusic', 'favoriteMovies',
    // Logical ordering for remaining actual fields
    'favoriteExpression', 'canSing', 'smokes', 'drinks', 'isSexual',
    'homeActivities', 'morningRoutine', 'likeInPerson', 'dislikeInPerson', 'turnOffs'
  ];

  const contentPriority = [
    'pricePerMinute', 'videoCallPrice', 'sellsUnderwear',
    // Logical ordering for remaining actual fields
    'bodyCount', 'hasFetish', 'fetishDetails', 'doesAnal', 'hasTriedOrgy', 'sexToysCount',
    'lovesThreesomes', 'favoritePosition', 'craziestSexPlace', 'fanHandlingPreference', 'socialMediaHandles'
  ];

  const sortFieldsByPriority = (data: any, priorityOrder: string[]) => {
    if (!data || typeof data !== 'object') return [];
    
    // Get ALL fields from the data object and priority list, regardless of whether they have values
    const allPossibleFields = new Set([
      ...priorityOrder,
      ...Object.keys(data)
    ]);

    // Create entries for ALL fields, using actual data or undefined for missing fields
    const allEntries = Array.from(allPossibleFields).map(key => [key, data[key]]);

    // Sort by priority order, then alphabetically for remaining fields
    return allEntries.sort(([keyA], [keyB]) => {
      const priorityA = priorityOrder.indexOf(keyA);
      const priorityB = priorityOrder.indexOf(keyB);
      
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;
      return keyA.localeCompare(keyB);
    });
  };

  const renderDataSection = (sectionData: any, title: string, priorityOrder: string[]) => {
    // Always render fields, even if sectionData is null/undefined
    const sortedEntries = sortFieldsByPriority(sectionData || {}, priorityOrder);

    return (
      <div className="space-y-3">
        {sortedEntries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-border/30">
            <div className="font-medium text-foreground text-sm">
              {formatFieldName(key)}:
            </div>
            <div className="md:col-span-2 text-muted-foreground break-words text-sm">
              {key === 'pets' && Array.isArray(value) ? (
                value.length > 0 ? (
                  <div className="space-y-2">
                    {value.map((pet: any, index: number) => (
                      <div key={index} className="bg-muted/30 p-2 rounded text-xs">
                        {Object.entries(pet).map(([petKey, petValue]) => (
                          <div key={petKey}>
                            <span className="font-medium">{formatFieldName(petKey)}:</span> {formatValue(petValue)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  formatValue(value)
                )
              ) : key === 'socialMediaHandles' && typeof value === 'object' && value !== null ? (
                <div className="space-y-1">
                  {Object.entries(value).map(([platform, handle]) => (
                    <div key={platform} className="text-xs">
                      <span className="font-medium">{formatFieldName(platform)}:</span> {formatValue(handle)}
                    </div>
                  ))}
                </div>
              ) : (
                formatValue(value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedPreview = (data: any) => {
    const sections = [
      { 
        title: 'Personal Information', 
        data: data?.personalInfo,
        priority: personalInfoPriority 
      },
      { 
        title: 'Physical Attributes', 
        data: data?.physicalAttributes,
        priority: physicalPriority 
      },
      { 
        title: 'Personal Preferences', 
        data: data?.personalPreferences,
        priority: preferencesPriority 
      },
      { 
        title: 'Content & Service', 
        data: data?.contentAndService,
        priority: contentPriority 
      }
    ];

    return (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="mb-4">
            <h4 className="text-base font-semibold mb-3 border-b pb-1 text-white">{section.title}</h4>
            {renderDataSection(section.data, section.title, section.priority)}
          </div>
        ))}
      </div>
    );
  };
  
  const handleDeclineClick = async (token: string) => {
    if (disabledTokens.has(token)) {
      console.log("Skipping decline action - token already being handled:", token);
      return;
    }
    
    try {
      // Mark this button as clicked and token as being handled
      setClickedButtons(prev => ({ ...prev, [token]: true }));
      setHandlingTokens(prev => new Set(prev).add(token));
      
      // Process the deletion (now decline)
      console.log("Decline button clicked for token:", token);
      await deleteSubmission(token);
    } finally {
      // Reset clicked state after completion
      setClickedButtons(prev => ({ ...prev, [token]: false }));
      setHandlingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(token);
        return newSet;
      });
    }
  };
  
  const handleAcceptClick = (submission: OnboardSubmission) => {
    const token = submission.token;
    if (disabledTokens.has(token)) {
      console.log("Skipping accept action - token already being handled:", token);
      return;
    }
    
    // Mark this button as clicked and token as being handled
    setClickedButtons(prev => ({ ...prev, [token]: true }));
    setHandlingTokens(prev => new Set(prev).add(token));
    
    // Process the acceptance
    console.log("Accept button clicked for token:", token);
    onAcceptClick(submission);
    
    // We'll reset this when modal closes or action completes
    setTimeout(() => {
      setClickedButtons(prev => ({ ...prev, [token]: false }));
      setHandlingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(token);
        return newSet;
      });
    }, 10000); // Timeout as safety measure
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <React.Fragment key={submission.token}>
                <TableRow>
                  <TableCell>{submission.email}</TableCell>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>
                    {formatDate(submission.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePreview(submission.token)}
                        title="Toggle preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeclineClick(submission.token)}
                        disabled={disabledTokens.has(submission.token)}
                        title="Decline submission"
                      >
                        {processingTokens.includes(submission.token) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAcceptClick(submission)}
                        disabled={disabledTokens.has(submission.token)}
                        title="Approve creator"
                      >
                        {processingTokens.includes(submission.token) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {submission.showPreview && (
                  <TableRow>
                    <TableCell colSpan={4} className="bg-muted/10">
                      <div className="p-4 rounded overflow-auto max-h-96">
                        <div className="max-w-4xl">
                          {renderFormattedPreview(submission.data)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {submissions.map((submission) => (
          <div key={submission.token} className="bg-muted/10 rounded-lg border border-border/20 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground block">Email</span>
                  <span className="text-foreground break-all text-sm">{submission.email}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Name</span>
                  <span className="text-foreground text-sm">{submission.name}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Submitted</span>
                  <span className="text-muted-foreground text-xs">{formatDate(submission.submittedAt)}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => togglePreview(submission.token)}
                  className="w-full min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {submission.showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeclineClick(submission.token)}
                    disabled={disabledTokens.has(submission.token)}
                    className="flex-1 min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                  >
                    {processingTokens.includes(submission.token) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="text-sm">Decline</span>
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleAcceptClick(submission)}
                    disabled={disabledTokens.has(submission.token)}
                    className="flex-1 min-h-[44px] touch-manipulation flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {processingTokens.includes(submission.token) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="text-sm">Accept</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {submission.showPreview && (
              <div className="border-t border-border/20 p-4 bg-muted/5">
                <div className="rounded overflow-auto max-h-96">
                  <div className="max-w-full">
                    {renderFormattedPreview(submission.data)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsTable;
