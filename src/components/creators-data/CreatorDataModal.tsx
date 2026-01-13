import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LocationPicker } from '@/components/ui/location-picker';
import { Edit, Save, X, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getTimezoneInfo } from '@/utils/timezoneUtils';
import { useAuth } from '@/context/AuthContext';
import AnnouncementsTab from './announcements/AnnouncementsTab';
import CalendarTab from './calendar/CalendarTab';
import { useQuery } from '@tanstack/react-query';

interface CreatorSubmission {
  id: string;
  name: string;
  email: string;
  submitted_at: string;
  data: any;
  token: string;
  timezone?: string;
}

interface CreatorDataModalProps {
  submission: CreatorSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate?: (updatedSubmission: CreatorSubmission) => void;
}

// Component to display location with local time
const LocationWithTime: React.FC<{ location: string; preloadedTimezone?: string }> = ({ location, preloadedTimezone }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timezoneInfo, setTimezoneInfo] = useState<{
    observesDST: boolean;
    currentlyInDST: boolean;
    formattedTime: string;
  } | null>(null);

  useEffect(() => {
    if (preloadedTimezone) {
      const updateTime = () => {
        const info = getTimezoneInfo(preloadedTimezone);
        setTimezoneInfo(info);
        setCurrentTime(info.formattedTime);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [preloadedTimezone]);

  const getDSTLabel = () => {
    if (!timezoneInfo) return '';
    
    if (!timezoneInfo.observesDST) {
      return ''; // No DST label for regions that don't observe DST
    }
    
    if (timezoneInfo.currentlyInDST) {
      return ' (DST)'; // Currently in daylight saving time
    }
    
    return ' (Standard)'; // Observes DST but currently in standard time
  };

  return (
    <div>
      <div className="text-muted-foreground break-words">{location || 'Not provided'}</div>
      {preloadedTimezone && currentTime && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Local time: {currentTime}{getDSTLabel()}</span>
        </div>
      )}
      {location && !preloadedTimezone && (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Timezone not detected</span>
        </div>
      )}
    </div>
  );
};

// Component for the dialog header time display
const HeaderTimeDisplay: React.FC<{ location: string; preloadedTimezone?: string }> = ({ location, preloadedTimezone }) => {
  const [timezoneInfo, setTimezoneInfo] = useState<{
    observesDST: boolean;
    currentlyInDST: boolean;
    formattedTime: string;
  } | null>(null);

  useEffect(() => {
    if (preloadedTimezone) {
      const updateTime = () => {
        const info = getTimezoneInfo(preloadedTimezone);
        setTimezoneInfo(info);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [preloadedTimezone]);

  const getDSTLabel = () => {
    if (!timezoneInfo) return '';
    
    if (!timezoneInfo.observesDST) {
      return ''; // No DST label for regions that don't observe DST
    }
    
    if (timezoneInfo.currentlyInDST) {
      return ' (DST)'; // Currently in daylight saving time
    }
    
    return ' (Standard)'; // Observes DST but currently in standard time
  };

  if (!location) {
    return <span>No location provided</span>;
  }

  if (!preloadedTimezone) {
    return <span>Timezone not detected for {location}</span>;
  }

  if (!timezoneInfo?.formattedTime) {
    return <span>Local time unavailable</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      <span>Local time: {timezoneInfo.formattedTime}{getDSTLabel()}</span>
    </div>
  );
};

const CreatorDataModal: React.FC<CreatorDataModalProps> = ({
  submission,
  open,
  onOpenChange,
  onDataUpdate,
}) => {
  const { toast } = useToast();
  const { userRole, userRoles } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [submissionData, setSubmissionData] = useState<any>(submission?.data || {});
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is Admin
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');

  // Check if user has editing permissions (exclude Chatter role)
  const canEdit = isAdmin ||
                  userRole === 'VA' || 
                  userRoles?.includes('VA');

  // Check if user is a Chatter (hide sensitive info like email)
  const isChatter = userRole === 'Chatter' || userRoles?.includes('Chatter');

  // Fetch creator ID based on email
  const { data: creatorData } = useQuery({
    queryKey: ['creator-by-email', submission?.email],
    queryFn: async () => {
      if (!submission?.email) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .eq('email', submission.email)
        .single();
      
      if (error) {
        console.error('Error fetching creator:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!submission?.email,
  });

  // Update submissionData when submission changes
  React.useEffect(() => {
    if (submission?.data) {
      setSubmissionData(submission.data);
    }
  }, [submission]);

  if (!submission) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatValue = (value: any, fieldKey?: string): string => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Not provided';
      return value.join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    
    // Add dollar sign for price fields
    if (fieldKey === 'pricePerMinute' || fieldKey === 'videoCallPrice' || fieldKey === 'dickRatePrice' || fieldKey === 'underwearSellingPrice') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 0) {
        return `$${numValue}`;
      }
    }
    
    return String(value);
  };

  const formatFieldName = (key: string): string => {
    // Handle specific field name mappings
    const fieldMappings: Record<string, string> = {
      'dateOfBirth': 'Real Date of Birth',
      'modelBirthday': 'Model Birthday',
      'age': 'Real Age',
      'modelAge': 'Model Age',
      'pricePerMinute': 'Custom Price per Minute',
      'videoCallPrice': 'Video Call Price per Minute',
      'customVideoNotes': 'Custom Video Notes',
      'videoCallNotes': 'Video Call Notes',
      'dickRatePrice': 'Dick Rate Price',
      'dickRateNotes': 'Dick Rate Notes',
      'underwearSellingPrice': 'Underwear Selling Price',
      'underwearSellingNotes': 'Underwear Selling Notes'
    };
    
    // Return custom mapping if it exists
    if (fieldMappings[key]) {
      return fieldMappings[key];
    }
    
    // Default formatting for other fields
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  const handleEditClick = (section: string, fieldKey: string, currentValue: any) => {
    if (!canEdit) return; // Prevent editing for non-authorized users
    
    const editKey = `${section}.${fieldKey}`;
    setEditingField(editKey);
    
    // Special handling for date fields
    if ((fieldKey === 'dateOfBirth' || fieldKey === 'modelBirthday') && currentValue) {
      try {
        // Try to parse the existing date value
        const dateValue = new Date(currentValue);
        setEditValue(dateValue);
      } catch (e) {
        setEditValue(new Date());
      }
    } else {
      setEditValue(currentValue || '');
    }
  };

  const updateDatabase = async (updatedData: any) => {
    try {
      setIsSaving(true);
      console.log('Updating both tables with data:', updatedData);
      console.log('Submission ID:', submission.id);
      console.log('Submission email:', submission.email);
      
      // Step 1: Update onboarding_submissions table
      const { data: submissionUpdateData, error: submissionError } = await supabase
        .from('onboarding_submissions')
        .update({ data: updatedData })
        .eq('id', submission.id)
        .select();

      if (submissionError) {
        console.error('Onboarding submissions update error:', submissionError);
        throw new Error(`Failed to update submission: ${submissionError.message}`);
      }

      console.log('Onboarding submissions update successful:', submissionUpdateData);

      // Step 2: Find and update the corresponding creator
      const { data: creators, error: findCreatorError } = await supabase
        .from('creators')
        .select('id, email, model_name')
        .eq('email', submission.email)
        .limit(1);

      if (findCreatorError) {
        console.error('Error finding creator:', findCreatorError);
        throw new Error(`Failed to find creator: ${findCreatorError.message}`);
      }

      if (!creators || creators.length === 0) {
        console.warn('No creator found with email:', submission.email);
        // Don't throw error here - submission update was successful
        toast({
          title: "Partial Update",
          description: "Submission updated but no matching creator found to update model profile.",
          variant: "default",
        });
      } else {
        const creatorId = creators[0].id;
        console.log('Found creator ID:', creatorId);

        // Step 3: Update creators table model_profile and model_name if changed
        const updatePayload: any = { model_profile: updatedData };
        
        // Get the old model_name before update for propagation
        const oldModelName = creators[0].model_name;
        const newModelName = updatedData.personalInfo?.modelName;
        
        // If model name was updated, also update the model_name column
        if (newModelName) {
          updatePayload.model_name = newModelName;
        }
        
        const { data: creatorUpdateData, error: creatorError } = await supabase
          .from('creators')
          .update(updatePayload)
          .eq('id', creatorId)
          .select();

        if (creatorError) {
          console.error('Creator model_profile update error:', creatorError);
          throw new Error(`Failed to update creator profile: ${creatorError.message}`);
        }

        console.log('Creator model_profile update successful:', creatorUpdateData);

        // If model_name changed, propagate to all related tables that use model_name
        if (oldModelName && newModelName && oldModelName !== newModelName) {
          console.log(`Model name changed from "${oldModelName}" to "${newModelName}", propagating to related tables...`);
          
          // Update creator_invoicing
          const { error: invoicingError } = await supabase
            .from('creator_invoicing')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (invoicingError) console.error('Error updating creator_invoicing model_name:', invoicingError);
          else console.log('Updated creator_invoicing model_name');
          
          // Update sales_tracker
          const { error: salesError } = await supabase
            .from('sales_tracker')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (salesError) console.error('Error updating sales_tracker model_name:', salesError);
          else console.log('Updated sales_tracker model_name');
          
          // Update customs
          const { error: customsError } = await supabase
            .from('customs')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (customsError) console.error('Error updating customs model_name:', customsError);
          else console.log('Updated customs model_name');
          
          // Update attendance
          const { error: attendanceError } = await supabase
            .from('attendance')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (attendanceError) console.error('Error updating attendance model_name:', attendanceError);
          else console.log('Updated attendance model_name');
          
          // Update voice_sources
          const { error: voiceError } = await supabase
            .from('voice_sources')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (voiceError) console.error('Error updating voice_sources model_name:', voiceError);
          else console.log('Updated voice_sources model_name');
          
          // Update generated_voice_clones
          const { error: voiceClonesError } = await supabase
            .from('generated_voice_clones')
            .update({ model_name: newModelName })
            .eq('model_name', oldModelName);
          if (voiceClonesError) console.error('Error updating generated_voice_clones model_name:', voiceClonesError);
          else console.log('Updated generated_voice_clones model_name');
        }
      }

      // Call the parent component's update handler if provided
      if (onDataUpdate) {
        onDataUpdate({
          ...submission,
          data: updatedData
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to update database:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = async (section: string, fieldKey: string) => {
    const editKey = `${section}.${fieldKey}`;
    
    // Create a deep copy of the submission data
    const newData = JSON.parse(JSON.stringify(submissionData));
    
    // Ensure the section exists
    if (!newData[section]) {
      newData[section] = {};
    }
    
    // Handle different value types
    let processedValue = editValue;
    if ((fieldKey === 'dateOfBirth' || fieldKey === 'modelBirthday') && editValue instanceof Date) {
      // Format date as YYYY-MM-DD for consistent storage
      processedValue = format(editValue, 'yyyy-MM-dd');
      } else if (fieldKey === 'age' || fieldKey === 'modelAge' || fieldKey === 'numberOfKids' || fieldKey === 'bodyCount' || fieldKey === 'sexToysCount' || fieldKey === 'pricePerMinute' || fieldKey === 'videoCallPrice' || fieldKey === 'dickRatePrice' || fieldKey === 'underwearSellingPrice') {
        processedValue = editValue === '' ? null : Number(editValue);
    } else if (fieldKey === 'hasPets' || fieldKey === 'hasKids' || fieldKey === 'hasTattoos' || fieldKey === 'canSing' || fieldKey === 'smokes' || fieldKey === 'drinks' || fieldKey === 'isSexual' || fieldKey === 'hasFetish' || fieldKey === 'doesAnal' || fieldKey === 'hasTriedOrgy' || fieldKey === 'lovesThreesomes' || fieldKey === 'sellsUnderwear' || fieldKey === 'isCircumcised') {
      processedValue = editValue === 'true' || editValue === true;
    } else if (fieldKey === 'hobbies' || fieldKey === 'placesVisited') {
      processedValue = typeof editValue === 'string' ? editValue.split(',').map(item => item.trim()).filter(item => item !== '') : editValue;
    }
    
    // Update the field
    newData[section][fieldKey] = processedValue;
    
    console.log('Saving field:', fieldKey, 'with value:', processedValue);
    console.log('New data structure:', newData);
    
    // Update local state first
    setSubmissionData(newData);
    
    // Save to both database tables
    const success = await updateDatabase(newData);
    
    if (success) {
      setEditingField(null);
      setEditValue('');
      
      toast({
        title: "Model Profile Updated",
        description: `${formatFieldName(fieldKey)} has been updated successfully.`,
      });
    } else {
      // Revert local changes if database update failed
      setSubmissionData(submission.data);
      toast({
        title: "Update Failed",
        description: `Failed to update ${formatFieldName(fieldKey)}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableField = (section: string, fieldKey: string, value: any) => {
    const editKey = `${section}.${fieldKey}`;
    const isEditing = editingField === editKey;
    
    if (isEditing && canEdit) {
      // Special handling for date of birth and model birthday fields
      if (fieldKey === 'dateOfBirth' || fieldKey === 'modelBirthday') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal h-12 sm:h-auto",
                    !editValue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editValue instanceof Date ? format(editValue, "MMMM dd, yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editValue instanceof Date ? editValue : undefined}
                  onSelect={(date) => setEditValue(date || new Date())}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }

      // Special handling for location fields
      if (fieldKey === 'location' || fieldKey === 'hometown') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex-1 w-full">
              <LocationPicker
                value={editValue || ''}
                onChange={(location) => setEditValue(location)}
                placeholder={`Search for ${fieldKey === 'location' ? 'current location' : 'hometown'}...`}
                showCurrentTime={fieldKey === 'location'}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }

      // Special handling for boolean fields
      if (fieldKey === 'hasPets' || fieldKey === 'hasKids' || fieldKey === 'hasTattoos' || fieldKey === 'canSing' || fieldKey === 'smokes' || fieldKey === 'drinks' || fieldKey === 'isSexual' || fieldKey === 'hasFetish' || fieldKey === 'doesAnal' || fieldKey === 'hasTriedOrgy' || fieldKey === 'lovesThreesomes' || fieldKey === 'sellsUnderwear' || fieldKey === 'isCircumcised') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={String(editValue)} onValueChange={setEditValue}>
              <SelectTrigger className="w-full sm:w-24 h-12 sm:h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }
      
      // Special handling for enum fields
      if (fieldKey === 'sex') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-full sm:w-32 h-12 sm:h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Transgender">Transgender</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }
      
      if (fieldKey === 'handedness') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-full sm:w-32 h-12 sm:h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Left">Left</SelectItem>
                <SelectItem value="Right">Right</SelectItem>
                <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }
      
      if (fieldKey === 'isTopOrBottom') {
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-full sm:w-32 h-12 sm:h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Top">Top</SelectItem>
                <SelectItem value="Bottom">Bottom</SelectItem>
                <SelectItem value="Versatile">Versatile</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }
      
      // For longer text fields, use textarea
      if (fieldKey === 'tattooDetails' || fieldKey === 'fetishDetails' || fieldKey === 'homeActivities' || fieldKey === 'morningRoutine' || fieldKey === 'likeInPerson' || fieldKey === 'dislikeInPerson' || fieldKey === 'turnOffs' || fieldKey === 'craziestSexPlace' || fieldKey === 'fanHandlingPreference' || fieldKey === 'additionalLocationNote' || fieldKey === 'customVideoNotes' || fieldKey === 'videoCallNotes' || fieldKey === 'dickRateNotes' || fieldKey === 'underwearSellingNotes') {
        return (
          <div className="flex flex-col gap-2">
            <Textarea 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[80px] text-base"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <Save className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Save</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
                <X className="h-3 w-3 mr-2 sm:mr-0" />
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        );
      }
      
      // Default input field
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input 
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 h-12 sm:h-auto text-base"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" onClick={() => handleSaveClick(section, fieldKey)} disabled={isSaving} className="h-12 sm:h-auto flex-1 sm:flex-none">
              <Save className="h-3 w-3 mr-2 sm:mr-0" />
              <span className="sm:hidden">Save</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-12 sm:h-auto flex-1 sm:flex-none">
              <X className="h-3 w-3 mr-2 sm:mr-0" />
              <span className="sm:hidden">Cancel</span>
            </Button>
          </div>
        </div>
      );
    }
    
    // Display mode - Remove duplicate labels, just show the value and edit button
    return (
      <div className="group flex items-center justify-between gap-3">
        <div className="flex-1 text-muted-foreground break-words min-w-0">
          {/* Special handling for date of birth and model birthday display */}
          {(fieldKey === 'dateOfBirth' || fieldKey === 'modelBirthday') && value ? (
            (() => {
              try {
                const date = new Date(value);
                return format(date, "MMMM dd, yyyy");
              } catch (e) {
                return formatValue(value, fieldKey);
              }
            })()
          ) : (fieldKey === 'location' || fieldKey === 'hometown') && value ? (
            <LocationWithTime location={value} preloadedTimezone={submission.timezone} />
          ) : fieldKey === 'pets' && Array.isArray(value) ? (
            value.length > 0 ? (
              <div className="space-y-2">
                {value.map((pet: any, index: number) => (
                  <div key={index} className="bg-muted/30 p-3 rounded text-sm">
                    {Object.entries(pet).map(([petKey, petValue]) => (
                      <div key={petKey} className="mb-1 last:mb-0">
                        <span className="font-medium">{formatFieldName(petKey)}:</span> {formatValue(petValue)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              formatValue(value, fieldKey)
            )
          ) : fieldKey === 'socialMediaHandles' && typeof value === 'object' && value !== null ? (
            <div className="space-y-2">
              {Object.entries(value).map(([platform, handle]) => {
                // Special handling for the "other" platforms array
                if (platform === 'other' && Array.isArray(handle)) {
                  return (
                    <div key={platform}>
                      <span className="font-medium">Other Platforms:</span>
                      <div className="ml-2 space-y-1 mt-1">
                        {handle.map((otherPlatform: any, index: number) => (
                          <div key={index} className="bg-muted/30 p-2 rounded text-sm">
                            <span className="font-medium">{otherPlatform.platform}:</span> {otherPlatform.handle}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                // Regular platform handling
                return (
                  <div key={platform} className="mb-1 last:mb-0">
                    <span className="font-medium">{formatFieldName(platform)}:</span> {formatValue(handle)}
                  </div>
                );
              })}
            </div>
          ) : (
            formatValue(value, fieldKey)
          )}
        </div>
        {/* Show edit button only for authorized users and exclude complex objects */}
        {canEdit && 
         !(fieldKey === 'pets' && Array.isArray(value) && value.length > 0) && 
         !(fieldKey === 'socialMediaHandles' && typeof value === 'object' && value !== null) && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
            onClick={() => handleEditClick(section, fieldKey, value)}
            disabled={isSaving}
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  const personalInfoPriority = [
    'modelName', 'fullName', 'nickname',
    ...(isAdmin ? ['age'] : []), // Real Age - only for Admin
    'modelAge',
    ...(isAdmin ? ['dateOfBirth'] : []), // Real Date of Birth - only for Admin
    'modelBirthday', 'location', 'additionalLocationNote', 'hometown', 'ethnicity',
    ...(isChatter ? [] : ['email']), // Hide email for Chatter role
    'sex', 'religion', 'relationshipStatus', 'handedness',
    'hasPets', 'pets', 'hasKids', 'numberOfKids', 'occupation', 'workplace', 'placesVisited'
  ];

  const physicalPriority = [
    'bodyType', 'height', 'weight', 'eyeColor',
    'hairColor', 'favoriteColor', 'dislikedColor', 'allergies',
    'hasTattoos', 'tattooDetails', 'bustWaistHip', 'dickSize', 'isCircumcised', 'isTopOrBottom'
  ];

  const preferencesPriority = [
    'hobbies', 'favoriteFood', 'favoriteDrink', 'favoriteMusic', 'favoriteMovies',
    'favoriteExpression', 'canSing', 'smokes', 'drinks', 'isSexual',
    'homeActivities', 'morningRoutine', 'likeInPerson', 'dislikeInPerson', 'turnOffs'
  ];

  const contentPriority = [
    'pricePerMinute', 'customVideoNotes', 'videoCallPrice', 'videoCallNotes', 'dickRatePrice', 'dickRateNotes', 
    'sellsUnderwear', 'underwearSellingPrice', 'underwearSellingNotes', 'bodyCount', 'hasFetish', 'fetishDetails', 
    'doesAnal', 'hasTriedOrgy', 'sexToysCount', 'lovesThreesomes', 'favoritePosition', 'craziestSexPlace', 
    'fanHandlingPreference', 'socialMediaHandles'
  ];

  const sortFieldsByPriority = (data: any, priorityOrder: string[]) => {
    if (!data || typeof data !== 'object') return [];
    
    const allPossibleFields = new Set([
      ...priorityOrder,
      ...Object.keys(data)
    ]);

    const allEntries = Array.from(allPossibleFields).map(key => [key, data[key]]);

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

  const renderAllData = () => {
    const sections = [
      { 
        title: 'Personal Information', 
        data: submissionData?.personalInfo,
        priority: personalInfoPriority,
        section: 'personalInfo'
      },
      { 
        title: 'Physical Attributes', 
        data: submissionData?.physicalAttributes,
        priority: physicalPriority,
        section: 'physicalAttributes'
      },
      { 
        title: 'Personal Preferences', 
        data: submissionData?.personalPreferences,
        priority: preferencesPriority,
        section: 'personalPreferences'
      },
      { 
        title: 'Content & Service', 
        data: submissionData?.contentAndService,
        priority: contentPriority,
        section: 'contentAndService'
      }
    ];

    return (
      <div className="space-y-6">
        {sections.map((sectionInfo, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{sectionInfo.title}</h3>
            {renderDataSection(sectionInfo.data, sectionInfo.title, sectionInfo.priority, sectionInfo.section)}
          </div>
        ))}
      </div>
    );
  };

  const renderDataSection = (sectionData: any, title: string, priorityOrder: string[], section: string) => {
    const sortedEntries = sortFieldsByPriority(sectionData || {}, priorityOrder);

    return (
      <div className="space-y-4">
        {sortedEntries.map(([key, value]) => {
          // Skip email field for Chatter users
          if (key === 'email' && isChatter) {
            return null;
          }
          
          // Skip Real Age and Real Date of Birth for non-Admin users
          if ((key === 'age' || key === 'dateOfBirth') && !isAdmin) {
            return null;
          }
          
          return (
            <div key={key} className="py-3 border-b border-border/50 last:border-b-0">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col space-y-2 sm:hidden">
                <div className="font-medium text-foreground text-base">
                  {formatFieldName(key)}:
                </div>
                <div>
                  {renderEditableField(section, key, value)}
                </div>
              </div>

              {/* Desktop Layout - Inline */}
              <div className="hidden sm:flex sm:items-center sm:gap-4">
                <div className="font-medium text-foreground text-base min-w-0 flex-shrink-0 w-48">
                  {formatFieldName(key)}:
                </div>
                <div className="flex-1 min-w-0">
                  {renderEditableField(section, key, value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] sm:w-full p-0">
        <div className="p-4 sm:p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-lg sm:text-xl">{submissionData?.personalInfo?.modelName || submission.name}'s Model Profile</span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Accepted</Badge>
                {!canEdit && (
                  <Badge variant="outline" className="text-muted-foreground">
                    View Only
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-sm">
              <HeaderTimeDisplay 
                location={submissionData?.personalInfo?.location || ''} 
                preloadedTimezone={submission.timezone} 
              />
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 min-h-0">
          <Tabs defaultValue="announcements" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-4 h-auto p-1">
              <TabsTrigger value="announcements" className="text-xs sm:text-sm py-2 px-1">Announce</TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs sm:text-sm py-2 px-1">Calendar</TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-1">All Data</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs sm:text-sm py-2 px-1">Personal</TabsTrigger>
              <TabsTrigger value="physical" className="text-xs sm:text-sm py-2 px-1">Physical</TabsTrigger>
              <TabsTrigger value="preferences" className="text-xs sm:text-sm py-2 px-1">Preferences</TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm py-2 px-1">Content</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[60vh] w-full">
                <div className="pr-4">
                  <TabsContent value="announcements" className="space-y-4 mt-0">
                    {creatorData?.id ? (
                      <AnnouncementsTab creatorId={creatorData.id} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Creator not found in database. Cannot load announcements.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="calendar" className="space-y-4 mt-0">
                    {creatorData?.id ? (
                      <CalendarTab creatorId={creatorData.id} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Creator not found in database. Cannot load calendar.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="space-y-4 mt-0">
                    {renderAllData()}
                  </TabsContent>

                  <TabsContent value="personal" className="space-y-4 mt-0">
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    {renderDataSection(submissionData?.personalInfo, 'Personal Information', personalInfoPriority, 'personalInfo')}
                  </TabsContent>
                  
                  <TabsContent value="physical" className="space-y-4 mt-0">
                    <h3 className="text-lg font-semibold mb-4">Physical Attributes</h3>
                    {renderDataSection(submissionData?.physicalAttributes, 'Physical Attributes', physicalPriority, 'physicalAttributes')}
                  </TabsContent>
                  
                  <TabsContent value="preferences" className="space-y-4 mt-0">
                    <h3 className="text-lg font-semibold mb-4">Personal Preferences</h3>
                    {renderDataSection(submissionData?.personalPreferences, 'Personal Preferences', preferencesPriority, 'personalPreferences')}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4 mt-0">
                    <h3 className="text-lg font-semibold mb-4">Content & Service</h3>
                    {renderDataSection(submissionData?.contentAndService, 'Content & Service', contentPriority, 'contentAndService')}
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorDataModal;
