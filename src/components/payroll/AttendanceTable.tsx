import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit3, Check, X, DollarSign, Send } from 'lucide-react';
import { getWeekStart as getWeekStartUtil, getDaysOfWeek } from '@/utils/weekCalculations';

interface AttendanceEntry {
  id: string;
  model_name: string;
  day_of_week: number;
  attendance: boolean;
  submitted_at?: string;
}

interface AttendanceTableProps {
  chatterId?: string;
  selectedWeek?: Date;
  isSalesLocked?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  chatterId,
  selectedWeek = new Date(),
  isSalesLocked = false
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});
  const [submissionData, setSubmissionData] = useState<Record<number, string>>({});
  const [tempInputs, setTempInputs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [editingHourlyRate, setEditingHourlyRate] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState<number>(0);
  const [chatterDepartment, setChatterDepartment] = useState<string | null | undefined>(undefined);

  const effectiveChatterId = chatterId || user?.id;
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canEdit = isAdmin || effectiveChatterId === user?.id;

  // Calculate week start based on department cutoff
  const weekStart = getWeekStartUtil(selectedWeek, chatterDepartment);
  const currentWeekStart = getWeekStartUtil(new Date(), chatterDepartment);
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeek = weekStart.getTime() > currentWeekStart.getTime();
  
  // Get days of week order based on department
  const DAYS_OF_WEEK = getDaysOfWeek(chatterDepartment);
  
  // Week is editable if it's current week or future, user has permissions, and sales aren't locked
  const isWeekEditable = canEdit && (isCurrentWeek || isFutureWeek) && !isSalesLocked;

  // First effect: fetch department
  useEffect(() => {
    const fetchDepartment = async () => {
      if (!effectiveChatterId) return;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', effectiveChatterId)
        .single();
      
      setChatterDepartment(profileData?.department || null);
    };
    
    fetchDepartment();
  }, [effectiveChatterId]);

  // Second effect: fetch attendance data once department is known
  useEffect(() => {
    if (effectiveChatterId && chatterDepartment !== undefined) {
      fetchAttendanceData();
    }
  }, [effectiveChatterId, selectedWeek, chatterDepartment]);

  const fetchAttendanceData = async () => {
    if (!effectiveChatterId) return;
    
    setIsLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch attendance data for the week including submission timestamps
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('day_of_week, model_name, attendance, submitted_at')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      // Fetch chatter's hourly rate
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('hourly_rate')
        .eq('id', effectiveChatterId)
        .single();

      if (profileError) throw profileError;

      // Create maps for attendance data and submission timestamps
      const attendanceMap: Record<number, string> = {};
      const submissionMap: Record<number, string> = {};
      const tempInputMap: Record<number, string> = {};
      
      attendanceData?.forEach(entry => {
        if (entry.attendance) {
          // If multiple models worked on the same day, join them with commas
          if (attendanceMap[entry.day_of_week]) {
            attendanceMap[entry.day_of_week] += `, ${entry.model_name}`;
          } else {
            attendanceMap[entry.day_of_week] = entry.model_name;
          }
        }
        
        // Store submission timestamp if available
        if (entry.submitted_at) {
          submissionMap[entry.day_of_week] = entry.submitted_at;
        }
      });

      // Initialize temp inputs with current attendance data
      DAYS_OF_WEEK.forEach(day => {
        tempInputMap[day.value] = attendanceMap[day.value] || '';
      });

      setAttendanceData(attendanceMap);
      setSubmissionData(submissionMap);
      setTempInputs(tempInputMap);
      setHourlyRate(profileData?.hourly_rate || 0);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAttendance = async (dayOfWeek: number) => {
    if (!effectiveChatterId || !isWeekEditable) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const modelNames = tempInputs[dayOfWeek] || '';
      
      // First, delete all attendance entries for this day
      await supabase
        .from('attendance')
        .delete()
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr)
        .eq('day_of_week', dayOfWeek);

      // If there are model names provided, create attendance entries with submission timestamp
      if (modelNames.trim()) {
        const modelList = modelNames.split(',').map(name => name.trim()).filter(name => name);
        const submittedAt = new Date().toISOString();
        
        for (const modelName of modelList) {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              chatter_id: effectiveChatterId,
              week_start_date: weekStartStr,
              day_of_week: dayOfWeek,
              model_name: modelName,
              attendance: true,
              submitted_at: submittedAt
            });

          if (insertError) throw insertError;
        }

        // Update local state
        setAttendanceData(prev => ({
          ...prev,
          [dayOfWeek]: modelNames.trim()
        }));
        setSubmissionData(prev => ({
          ...prev,
          [dayOfWeek]: submittedAt
        }));
      } else {
        // If no models, clear the attendance for this day
        setAttendanceData(prev => {
          const newData = { ...prev };
          delete newData[dayOfWeek];
          return newData;
        });
        setSubmissionData(prev => {
          const newData = { ...prev };
          delete newData[dayOfWeek];
          return newData;
        });
      }

      toast({
        title: "Success",
        description: "Attendance submitted successfully",
      });
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to submit attendance",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (dayOfWeek: number, value: string) => {
    setTempInputs(prev => ({
      ...prev,
      [dayOfWeek]: value
    }));
  };

  const updateHourlyRate = async (newRate: number) => {
    if (!effectiveChatterId || !isAdmin) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hourly_rate: newRate })
        .eq('id', effectiveChatterId);

      if (error) throw error;

      setHourlyRate(newRate);
      toast({
        title: "Success",
        description: "Hourly rate updated successfully",
      });
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast({
        title: "Error",
        description: "Failed to update hourly rate",
        variant: "destructive",
      });
    }
  };

  const startEditingHourlyRate = () => {
    setTempHourlyRate(hourlyRate);
    setEditingHourlyRate(true);
  };

  const saveHourlyRate = async () => {
    await updateHourlyRate(tempHourlyRate);
    setEditingHourlyRate(false);
  };

  const cancelEditingHourlyRate = () => {
    setTempHourlyRate(hourlyRate);
    setEditingHourlyRate(false);
  };

  const formatSubmissionTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a MMM dd');
  };

  if (isLoading) {
    return (
      <Card className="bg-secondary/10 border-muted">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-32 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/10 border-muted">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Attendance Tracker
          {isSalesLocked && (
            <span className="text-sm text-muted-foreground font-normal ml-2">
              (Locked with Weekly Sales)
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Hourly Rate:</span>
            {editingHourlyRate ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={tempHourlyRate}
                  onChange={(e) => setTempHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-sm"
                  step="0.01"
                  min="0"
                />
                <div className="flex items-center gap-1">
                  <Check
                    className="h-4 w-4 text-green-600 cursor-pointer hover:text-green-800"
                    onClick={saveHourlyRate}
                  />
                  <X
                    className="h-4 w-4 text-red-600 cursor-pointer hover:text-red-800"
                    onClick={cancelEditingHourlyRate}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">${hourlyRate.toFixed(2)}</span>
                {isAdmin && (
                  <Edit3
                    className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={startEditingHourlyRate}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Day</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="min-w-[300px]">Models Worked (comma separated)</TableHead>
                <TableHead className="w-[150px] text-center">Action/Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS_OF_WEEK.map((day, index) => {
                const dayDate = addDays(weekStart, index);
                const hasAttendance = Boolean(attendanceData[day.value]?.trim());
                const isSubmitted = Boolean(submissionData[day.value]);
                const currentInput = tempInputs[day.value] || '';
                const hasChanges = currentInput !== (attendanceData[day.value] || '');
                
                return (
                  <TableRow key={day.value}>
                    <TableCell className="font-medium">{day.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(dayDate, 'MMM dd')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={currentInput}
                        onChange={(e) => handleInputChange(day.value, e.target.value)}
                        className="w-full"
                        disabled={!isWeekEditable || isSubmitted}
                        placeholder="e.g., Model1, Model2, Model3"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {isSubmitted ? (
                        <div className="text-xs text-muted-foreground">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                            hasAttendance 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {hasAttendance ? 'Present' : 'Absent'}
                          </div>
                          <div>
                            {formatSubmissionTime(submissionData[day.value])}
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => submitAttendance(day.value)}
                          disabled={!isWeekEditable || !hasChanges}
                          size="sm"
                          className="h-8"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Submit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Instructions:</strong> Enter the names of models you worked with for each day, separated by commas. 
            Click "Submit" to save your attendance for that day. Once submitted, the timestamp will show when you submitted your attendance.
            Leave empty for days you were absent.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};