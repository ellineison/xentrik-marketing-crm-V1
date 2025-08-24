import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

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
      const { data: salesData, error } = await supabase
        .from('sales_tracker')
        .select('day_of_week, model_name, attendance')
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr);

      if (error) throw error;

      // Create a map of day_of_week to model names for attendance
      const attendanceMap: Record<number, string> = {};
      
      salesData?.forEach(entry => {
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
      
      // First, set all attendance to false for this day
      const { error: resetError } = await supabase
        .from('sales_tracker')
        .update({ attendance: false })
        .eq('chatter_id', effectiveChatterId)
        .eq('week_start_date', weekStartStr)
        .eq('day_of_week', dayOfWeek);

      if (resetError) throw resetError;

      // If there are model names provided, set attendance to true for those models
      if (modelNames.trim()) {
        const modelList = modelNames.split(',').map(name => name.trim()).filter(name => name);
        
        for (const modelName of modelList) {
          const { error: updateError } = await supabase
            .from('sales_tracker')
            .update({ attendance: true })
            .eq('chatter_id', effectiveChatterId)
            .eq('week_start_date', weekStartStr)
            .eq('day_of_week', dayOfWeek)
            .eq('model_name', modelName);

          // If model doesn't exist for this day, create a minimal entry
          if (updateError) {
            const { error: insertError } = await supabase
              .from('sales_tracker')
              .upsert({
                chatter_id: effectiveChatterId,
                week_start_date: weekStartStr,
                day_of_week: dayOfWeek,
                model_name: modelName,
                earnings: 0,
                working_day: true,
                attendance: true
              }, {
                onConflict: 'chatter_id,model_name,day_of_week,week_start_date'
              });

            if (insertError) throw insertError;
          }
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
              {DAYS_OF_WEEK.map((day) => {
                const dayDate = addDays(weekStart, day.value === 0 ? 3 : day.value - 4);
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