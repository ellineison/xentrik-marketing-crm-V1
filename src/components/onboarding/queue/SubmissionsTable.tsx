
import React, { useMemo, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Trash2, Check, Loader2, Edit2, Save, X, Download } from "lucide-react";
import { OnboardSubmission } from "@/hooks/useOnboardingSubmissions";
import { generateOnboardingPDF } from "@/utils/onboardingPdfGenerator";

interface SubmissionsTableProps {
  submissions: OnboardSubmission[];
  processingTokens: string[];
  formatDate: (dateString: string) => string;
  togglePreview: (token: string) => void;
  deleteSubmission: (token: string) => Promise<void>;
  onAcceptClick: (submission: OnboardSubmission) => void;
  onUpdateSubmission?: (token: string, updatedData: any) => Promise<void>;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  processingTokens,
  formatDate,
  togglePreview,
  deleteSubmission,
  onAcceptClick,
  onUpdateSubmission
}) => {
  // Track buttons that have been clicked to prevent double clicks
  const [clickedButtons, setClickedButtons] = React.useState<Record<string, boolean>>({});
  const [handlingTokens, setHandlingTokens] = React.useState<Set<string>>(new Set());
  
  // Track editing state for each field
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [localSubmissions, setLocalSubmissions] = useState(submissions);
  
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

  // Update local submissions when props change
  React.useEffect(() => {
    setLocalSubmissions(submissions);
  }, [submissions]);

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
    // Handle specific field name mappings
    const fieldMappings: Record<string, string> = {
      'dateOfBirth': 'Real Date of Birth',
      'modelBirthday': 'Model Birthday',
      'age': 'Real Age',
      'modelAge': 'Model Age',
    };
    
    if (fieldMappings[key]) {
      return fieldMappings[key];
    }
    
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  // Updated field priority orders to match actual schema fields only
  const personalInfoPriority = [
    'modelName', 'fullName', 'nickname', 'age', 'modelAge', 'dateOfBirth', 'modelBirthday', 'location', 'hometown', 'ethnicity',
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

  // Editing functions
  const startEditing = (token: string, sectionKey: string, fieldKey: string, currentValue: any) => {
    const fullKey = `${token}.${sectionKey}.${fieldKey}`;
    setEditingFields(prev => ({ ...prev, [fullKey]: fullKey }));
    setEditingValues(prev => ({ ...prev, [fullKey]: currentValue }));
  };

  const cancelEditing = (token: string, sectionKey: string, fieldKey: string) => {
    const fullKey = `${token}.${sectionKey}.${fieldKey}`;
    setEditingFields(prev => {
      const newState = { ...prev };
      delete newState[fullKey];
      return newState;
    });
    setEditingValues(prev => {
      const newState = { ...prev };
      delete newState[fullKey];
      return newState;
    });
  };

  const saveFieldEdit = async (token: string, sectionKey: string, fieldKey: string) => {
    const fullKey = `${token}.${sectionKey}.${fieldKey}`;
    const newValue = editingValues[fullKey];
    
    try {
      // Update local state immediately
      setLocalSubmissions(prev => prev.map(sub => {
        if (sub.token === token) {
          const updatedData = { ...sub.data };
          if (!updatedData[sectionKey]) {
            updatedData[sectionKey] = {};
          }
          updatedData[sectionKey][fieldKey] = newValue;
          return { ...sub, data: updatedData };
        }
        return sub;
      }));

      // Save to database if update function is provided
      if (onUpdateSubmission) {
        const submission = localSubmissions.find(s => s.token === token);
        if (submission) {
          const updatedData = { ...submission.data };
          if (!updatedData[sectionKey]) {
            updatedData[sectionKey] = {};
          }
          updatedData[sectionKey][fieldKey] = newValue;
          await onUpdateSubmission(token, updatedData);
        }
      }

      // Clear editing state
      cancelEditing(token, sectionKey, fieldKey);
    } catch (error) {
      console.error('Error saving field edit:', error);
      // Revert local state on error
      setLocalSubmissions(submissions);
    }
  };

  const renderEditableField = (token: string, sectionKey: string, fieldKey: string, value: any) => {
    const fullKey = `${token}.${sectionKey}.${fieldKey}`;
    const isEditing = editingFields[fullKey];
    const editValue = editingValues[fullKey];

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {typeof value === 'string' && value.length > 50 ? (
            <Textarea
              value={editValue ?? ''}
              onChange={(e) => setEditingValues(prev => ({ ...prev, [fullKey]: e.target.value }))}
              className="flex-1 min-h-[60px]"
              rows={3}
            />
          ) : (
            <Input
              value={editValue ?? ''}
              onChange={(e) => setEditingValues(prev => ({ ...prev, [fullKey]: e.target.value }))}
              className="flex-1"
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => saveFieldEdit(token, sectionKey, fieldKey)}
            className="h-8 w-8 p-0"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => cancelEditing(token, sectionKey, fieldKey)}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-start justify-between group">
        <span className="flex-1">{formatValue(value)}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEditing(token, sectionKey, fieldKey, value)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderDataSection = (token: string, sectionData: any, title: string, priorityOrder: string[], sectionKey: string) => {
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
                  renderEditableField(token, sectionKey, key, value)
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
                renderEditableField(token, sectionKey, key, value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedPreview = (token: string, data: any) => {
    const sections = [
      { 
        title: 'Personal Information', 
        data: data?.personalInfo,
        priority: personalInfoPriority,
        key: 'personalInfo'
      },
      { 
        title: 'Physical Attributes', 
        data: data?.physicalAttributes,
        priority: physicalPriority,
        key: 'physicalAttributes'
      },
      { 
        title: 'Personal Preferences', 
        data: data?.personalPreferences,
        priority: preferencesPriority,
        key: 'personalPreferences'
      },
      { 
        title: 'Content & Service', 
        data: data?.contentAndService,
        priority: contentPriority,
        key: 'contentAndService'
      }
    ];

    return (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index} className="mb-4">
            <h4 className="text-base font-semibold mb-3 border-b pb-1 text-foreground">{section.title}</h4>
            {renderDataSection(token, section.data, section.title, section.priority, section.key)}
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
            {localSubmissions.map((submission) => (
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
                        onClick={() => generateOnboardingPDF(submission)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
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
                          {renderFormattedPreview(submission.token, submission.data)}
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
        {localSubmissions.map((submission) => (
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => togglePreview(submission.token)}
                    className="flex-1 min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {submission.showPreview ? 'Hide' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateOnboardingPDF(submission)}
                    className="flex-1 min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
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
                    {renderFormattedPreview(submission.token, submission.data)}
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
