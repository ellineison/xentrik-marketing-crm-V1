import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { getWeekStart, getWeekEnd, getActualDate } from '@/utils/weekCalculations';

interface AttendanceExportButtonProps {
  selectedChatterId?: string | null;
  selectedWeek?: Date; // Only used for custom export dialog
  selectedTeam?: string | null;
}

export const AttendanceExportButton: React.FC<AttendanceExportButtonProps> = ({
  selectedChatterId,
  selectedWeek = new Date(),
  selectedTeam,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // First, get all users that match the filter criteria
      let usersQuery = supabase
        .from('profiles')
        .select('id, name, email, department, role, roles')
        .neq('role', 'Creator')
        .not('roles', 'cs', '{Creator}')
        .eq('status', 'Active');

      // Apply team filter if specified
      if (selectedTeam) {
        if (selectedTeam === 'Admin') {
          usersQuery = usersQuery.eq('role', 'Admin');
        } else if (selectedTeam === 'Manager') {
          usersQuery = usersQuery.eq('role', 'Manager');
        } else {
          usersQuery = usersQuery.eq('department', selectedTeam);
        }
      }

      // Apply single chatter filter if specified
      if (selectedChatterId) {
        usersQuery = usersQuery.eq('id', selectedChatterId);
      }

      const { data: allUsers, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        toast({
          title: 'No Users',
          description: 'No users found for the selected criteria.',
          variant: 'destructive',
        });
        return;
      }

      // Then get attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .order('week_start_date', { ascending: true })
        .order('day_of_week', { ascending: true });

      // Apply filters
      const userIds = allUsers.map(u => u.id);
      attendanceQuery = attendanceQuery.in('chatter_id', userIds);

      if (startDate && endDate) {
        attendanceQuery = attendanceQuery
          .gte('week_start_date', format(startDate, 'yyyy-MM-dd'))
          .lte('week_start_date', format(endDate, 'yyyy-MM-dd'));
      } else if (selectedWeek) {
        // For export, use standard cutoff (we'll adjust per user in the loop)
        const weekStart = getWeekStart(selectedWeek);
        attendanceQuery = attendanceQuery.eq('week_start_date', format(weekStart, 'yyyy-MM-dd'));
      }

      const { data: attendanceRecords, error } = await attendanceQuery;
      if (error) throw error;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(allUsers.map(p => [p.id, p]));

      // Group attendance records by chatter
      const recordsByChatter = new Map<string, any[]>();
      attendanceRecords?.forEach((record: any) => {
        if (!recordsByChatter.has(record.chatter_id)) {
          recordsByChatter.set(record.chatter_id, []);
        }
        recordsByChatter.get(record.chatter_id)?.push(record);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Create a sheet for each user (including those without attendance)
      allUsers.forEach(user => {
        const chatterRecords = recordsByChatter.get(user.id) || [];
        const chatterName = user.name || 'Unknown';

        let excelData: any[] = [];

        if (chatterRecords.length === 0) {
          // User has no attendance records - create a blank row
          excelData = [{
            'Week Start': '',
            'Day of Week': '',
            'Date': '',
            'Attendance': 'No attendance submitted',
            'Models Worked': '',
            'Submitted At': '',
          }];
        } else {
          // Group records by date (week_start_date + day_of_week)
          const recordsByDate = new Map<string, any[]>();
          chatterRecords.forEach((record: any) => {
            const weekStartDate = new Date(record.week_start_date);
            const actualDate = getActualDate(weekStartDate, record.day_of_week, user.department, user.role, user.roles);
            const dateKey = format(actualDate, 'yyyy-MM-dd');
            
            if (!recordsByDate.has(dateKey)) {
              recordsByDate.set(dateKey, []);
            }
            recordsByDate.get(dateKey)?.push(record);
          });

          // Transform data for this chatter - one row per date
          excelData = Array.from(recordsByDate.entries()).map(([dateKey, dateRecords]) => {
            const firstRecord = dateRecords[0];
            const weekStartDate = new Date(firstRecord.week_start_date);
            const actualDate = getActualDate(weekStartDate, firstRecord.day_of_week, user.department, user.role, user.roles);
            // Calculate the correct week start for this user's department and role
            const userWeekStart = getWeekStart(weekStartDate, user.department, user.role, user.roles);

            // Combine all model names for this date
            const modelsWorked = dateRecords
              .map(r => r.model_name)
              .filter(m => m)
              .join(', ') || 'N/A';

            return {
              'Week Start': format(userWeekStart, 'MMM dd, yyyy'),
              'Day of Week': dayNames[firstRecord.day_of_week],
              'Date': format(actualDate, 'MMM dd, yyyy'),
              'Attendance': firstRecord.attendance ? 'Present' : 'Absent',
              'Models Worked': modelsWorked,
              'Submitted At': firstRecord.submitted_at ? format(new Date(firstRecord.submitted_at), 'MMM dd, yyyy HH:mm') : 'Not Submitted',
            };
          });
        }

        // Create worksheet for this chatter
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(excelData[0] || {}).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...excelData.map((row: any) => String(row[key] || '').length)
          );
          return { wch: Math.min(maxLen + 2, maxWidth) };
        });
        ws['!cols'] = colWidths;

        // Sanitize sheet name (Excel has 31 char limit and doesn't allow special chars)
        const sanitizedName = chatterName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
      });

      // Generate filename
      const dateRange = startDate && endDate
        ? `${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
        : format(getWeekStart(selectedWeek), 'yyyy-MM-dd');
      const teamName = selectedTeam ? selectedTeam.replace(/\s+/g, '_') : 'All_Teams';
      const chatterName = selectedChatterId ? 'Single_Chatter' : teamName;
      const filename = `Attendance_${chatterName}_${dateRange}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Successful',
        description: `Attendance data exported to ${filename}`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export attendance data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async () => {
    setIsExporting(true);
    try {
      // Use current date for "Export Current Week"
      const currentDate = new Date();
      const weekStart = getWeekStart(currentDate);
      
      // First, get all users that match the filter criteria
      let usersQuery = supabase
        .from('profiles')
        .select('id, name, email, department, role, roles')
        .neq('role', 'Creator')
        .not('roles', 'cs', '{Creator}')
        .eq('status', 'Active');

      // Apply team filter if specified
      if (selectedTeam) {
        if (selectedTeam === 'Admin') {
          usersQuery = usersQuery.eq('role', 'Admin');
        } else if (selectedTeam === 'Manager') {
          usersQuery = usersQuery.eq('role', 'Manager');
        } else {
          usersQuery = usersQuery.eq('department', selectedTeam);
        }
      }

      // Apply single chatter filter if specified
      if (selectedChatterId) {
        usersQuery = usersQuery.eq('id', selectedChatterId);
      }

      const { data: allUsers, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        toast({
          title: 'No Users',
          description: 'No users found for the selected criteria.',
          variant: 'destructive',
        });
        return;
      }

      // Then get attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .eq('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .order('day_of_week', { ascending: true });

      const userIds = allUsers.map(u => u.id);
      attendanceQuery = attendanceQuery.in('chatter_id', userIds);

      const { data: attendanceRecords, error } = await attendanceQuery;
      if (error) throw error;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(allUsers.map(p => [p.id, p]));

      // Group attendance records by chatter
      const recordsByChatter = new Map<string, any[]>();
      attendanceRecords?.forEach((record: any) => {
        if (!recordsByChatter.has(record.chatter_id)) {
          recordsByChatter.set(record.chatter_id, []);
        }
        recordsByChatter.get(record.chatter_id)?.push(record);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Create a sheet for each user (including those without attendance)
      allUsers.forEach(user => {
        const chatterRecords = recordsByChatter.get(user.id) || [];
        const chatterName = user.name || 'Unknown';

        let excelData: any[] = [];

        if (chatterRecords.length === 0) {
          // User has no attendance records - create a blank row
          excelData = [{
            'Week Start': '',
            'Day of Week': '',
            'Date': '',
            'Attendance': 'No attendance submitted',
            'Models Worked': '',
            'Submitted At': '',
          }];
        } else {
          // Group records by date (week_start_date + day_of_week)
          const recordsByDate = new Map<string, any[]>();
          const userWeekStart = getWeekStart(currentDate, user.department, user.role, user.roles);
          chatterRecords.forEach((record: any) => {
            const actualDate = getActualDate(userWeekStart, record.day_of_week, user.department, user.role, user.roles);
            const dateKey = format(actualDate, 'yyyy-MM-dd');
            
            if (!recordsByDate.has(dateKey)) {
              recordsByDate.set(dateKey, []);
            }
            recordsByDate.get(dateKey)?.push(record);
          });

          // Transform data for this chatter - one row per date
          excelData = Array.from(recordsByDate.entries()).map(([dateKey, dateRecords]) => {
            const firstRecord = dateRecords[0];
            const userWeekStart = getWeekStart(currentDate, user.department, user.role, user.roles);
            const actualDate = getActualDate(userWeekStart, firstRecord.day_of_week, user.department, user.role, user.roles);

            // Combine all model names for this date
            const modelsWorked = dateRecords
              .map(r => r.model_name)
              .filter(m => m)
              .join(', ') || 'N/A';

            return {
              'Week Start': format(userWeekStart, 'MMM dd, yyyy'),
              'Day of Week': dayNames[firstRecord.day_of_week],
              'Date': format(actualDate, 'MMM dd, yyyy'),
              'Attendance': firstRecord.attendance ? 'Present' : 'Absent',
              'Models Worked': modelsWorked,
              'Submitted At': firstRecord.submitted_at ? format(new Date(firstRecord.submitted_at), 'MMM dd, yyyy HH:mm') : 'Not Submitted',
            };
          });
        }

        // Create worksheet for this chatter
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(excelData[0] || {}).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...excelData.map((row: any) => String(row[key] || '').length)
          );
          return { wch: Math.min(maxLen + 2, maxWidth) };
        });
        ws['!cols'] = colWidths;

        // Sanitize sheet name (Excel has 31 char limit and doesn't allow special chars)
        const sanitizedName = chatterName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
      });

      // Generate filename
      const teamName = selectedTeam ? selectedTeam.replace(/\s+/g, '_') : 'All_Teams';
      const chatterName = selectedChatterId ? 'Single_Chatter' : teamName;
      const filename = `Attendance_${chatterName}_${format(weekStart, 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Successful',
        description: `Attendance data exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting attendance:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export attendance data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleQuickExport}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export Current Week
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Custom Export
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Attendance Data</DialogTitle>
            <DialogDescription>
              Select a date range to export attendance records. Leave empty to export current week only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
