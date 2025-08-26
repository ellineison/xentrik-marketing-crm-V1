import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit3, Check, X, DollarSign } from 'lucide-react';

interface AttendanceEntry {
  id: string;
  model_name: string;
  day_of_week: number;
  attendance: boolean;
}

interface AttendanceTableProps {
  chatterId?: string;
  selectedWeek?: Date;
  isSalesLocked?: boolean;
}

const DAYS_OF_WEEK = [
  { label: 'Thu', value: 4, fullName: 'Thursday' },
  { label: 'Fri', value: 5, fullName: 'Friday' },
  { label: 'Sat', value: 6, fullName: 'Saturday' },
  { label: 'Sun', value: 0, fullName: 'Sunday' },
  { label: 'Mon', value: 1, fullName: 'Monday' },
  { label: 'Tue', value: 2, fullName: 'Tuesday' },
  { label: 'Wed', value: 3, fullName: 'Wednesday' },
];

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  chatterId,
  selectedWeek = new Date(),
  isSalesLocked = false
}) => {
  const { user, userRole, userRoles } = useAuth();
  const { toast } = useToast();
  const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [editingHourlyRate, setEditingHourlyRate] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState<number>(0);

  const effectiveChatterId = chatterId || user?.id;
  const isAdmin = userRole === 'Admin' || userRoles?.includes('Admin');
  const canEdit = isAdmin || effectiveChatterId === user?.id;

  // Calculate week start (Thursday)
  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const thursday = new Date(date);
    thursday.setHours(0, 0, 0, 0);
    
    if (day === 0) { // Sunday
      thursday.setDate(date.getDate() - 3);
    } else if (day === 1) { // Monday
      thursday.setDate(date.getDate() - 4);
    } else if (day === 2) { // Tuesday
      thursday.setDate(date.getDate() - 5);
    } else if (day === 3) { // Wednesday
      thursday.setDate(date.getDate() - 6);
    } else if (day === 4) { // Thursday
      thursday.setDate(date.getDate());
    } else if (day === 5) { // Friday
      thursday.setDate(date.getDate() - 1);
    } else if (day === 6) { // Saturday
      thursday.setDate(date.getDate() - 2);
    }
    
    return thursday;
  };

  const weekStart = getWeekStart(selectedWeek);
  const currentWeekStart = getWeekStart(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const isFutureWeek = weekStart.getTime() > currentWeekStart.getTime();
  
  // Week is editable if it's current week or future, user has permissions, and sales aren't locked
  const isWeekEditable = canEdit && (isCurrentWeek || isFutureWeek) && !isSalesLocked;

  useEffect(() => {
    if (effectiveChatterId) {
      fetchAttendanceData();
    }
  }, [effectiveChatterId, selectedWeek]);

  const fetchAttendanceData = async () => {
    if (!effectiveChatterId) return;
    
    setIsLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Fetch attendance data for the week
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('day_of_week, model_name, attendance')
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

      // Create a map of day_of_week to model names for attendance
      const attendanceMap: Record<number, string> = {};
      
      attendanceData?.forEach(entry => {
        if (entry.attendance) {
          // If multiple models worked on the same day, join them with commas
          if (attendanceMap[entry.day_of_week]) {
            attendanceMap[entry.day_of_week] += `, ${entry.model_name}`;
          } else {
            attendanceMap[entry.day_of_week] = entry.model_name;
          }
        }
      });

      setAttendanceData(attendanceMap);
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

  const updateAttendance = async (dayOfWeek: number, modelNames: string) => {
    if (!effectiveChatterId || !isWeekEditable) return;

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // First, delete all attendance entries for this day
      await supabase
        .from('attendance')
        .delete()
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr)
        .eq('day_of_week', dayOfWeek);

      // If there are model names provided, create attendance entries
      if (modelNames.trim()) {
        const modelList = modelNames.split(',').map(name => name.trim()).filter(name => name);
        
        for (const modelName of modelList) {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert({
              chatter_id: effectiveChatterId,
              week_start_date: weekStartStr,
              day_of_week: dayOfWeek,
              model_name: modelName,
              attendance: true
            });

          if (insertError) throw insertError;
        }
      }

      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [dayOfWeek]: modelNames.trim()
      }));

      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  const handleInputBlur = async (dayOfWeek: number, inputValue: string) => {
    const currentValue = attendanceData[dayOfWeek] || '';
    
    // Only update if value changed
    if (inputValue !== currentValue) {
      await updateAttendance(dayOfWeek, inputValue);
    }
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
                <TableHead className="w-[100px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS_OF_WEEK.map((day, index) => {
                const dayDate = addDays(weekStart, index);
                const hasAttendance = Boolean(attendanceData[day.value]?.trim());
                
                return (
                  <TableRow key={day.value}>
                    <TableCell className="font-medium">{day.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(dayDate, 'MMM dd')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        defaultValue={attendanceData[day.value] || ''}
                        onBlur={(e) => {
                          handleInputBlur(day.value, e.target.value);
                        }}
                        className="w-full"
                        disabled={!isWeekEditable}
                        placeholder="e.g., Model1, Model2, Model3"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        hasAttendance 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {hasAttendance ? 'Present' : 'Absent'}
                      </div>
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
            Leave empty for days you were absent. Attendance is automatically locked when you lock your weekly sales.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};