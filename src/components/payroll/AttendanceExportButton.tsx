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

interface AttendanceExportButtonProps {
  selectedChatterId?: string | null;
  selectedWeek?: Date;
}

export const AttendanceExportButton: React.FC<AttendanceExportButtonProps> = ({
  selectedChatterId,
  selectedWeek = new Date(),
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getWeekStart = (date: Date) => {
    const day = date.getDay();
    const thursday = new Date(date);
    thursday.setHours(0, 0, 0, 0);
    
    if (day === 0) thursday.setDate(date.getDate() - 3);
    else if (day === 1) thursday.setDate(date.getDate() - 4);
    else if (day === 2) thursday.setDate(date.getDate() - 5);
    else if (day === 3) thursday.setDate(date.getDate() - 6);
    else if (day === 4) thursday.setDate(date.getDate());
    else if (day === 5) thursday.setDate(date.getDate() - 1);
    else if (day === 6) thursday.setDate(date.getDate() - 2);
    
    return thursday;
  };

  const getWeekEnd = (weekStart: Date) => {
    const wednesday = new Date(weekStart);
    wednesday.setDate(weekStart.getDate() + 6);
    wednesday.setHours(23, 59, 59, 999);
    return wednesday;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // First get attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .order('week_start_date', { ascending: true })
        .order('day_of_week', { ascending: true });

      // Apply filters
      if (selectedChatterId) {
        attendanceQuery = attendanceQuery.eq('chatter_id', selectedChatterId);
      }

      if (startDate && endDate) {
        attendanceQuery = attendanceQuery
          .gte('week_start_date', format(startDate, 'yyyy-MM-dd'))
          .lte('week_start_date', format(endDate, 'yyyy-MM-dd'));
      } else if (selectedWeek) {
        const weekStart = getWeekStart(selectedWeek);
        attendanceQuery = attendanceQuery.eq('week_start_date', format(weekStart, 'yyyy-MM-dd'));
      }

      const { data: attendanceRecords, error } = await attendanceQuery;

      if (error) throw error;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: 'No Data',
          description: 'No attendance records found for the selected criteria.',
          variant: 'destructive',
        });
        return;
      }

      // Get unique chatter IDs
      const chatterIds = [...new Set(attendanceRecords.map(r => r.chatter_id))];

      // Fetch profiles for these chatters
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', chatterIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group attendance records by chatter
      const recordsByChatter = new Map<string, any[]>();
      attendanceRecords.forEach((record: any) => {
        if (!recordsByChatter.has(record.chatter_id)) {
          recordsByChatter.set(record.chatter_id, []);
        }
        recordsByChatter.get(record.chatter_id)?.push(record);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Create a sheet for each chatter
      recordsByChatter.forEach((chatterRecords, chatterId) => {
        const profile = profileMap.get(chatterId);
        const chatterName = profile?.name || 'Unknown';

        // Group records by date (week_start_date + day_of_week)
        const recordsByDate = new Map<string, any[]>();
        chatterRecords.forEach((record: any) => {
          const weekStartDate = new Date(record.week_start_date);
          const actualDate = new Date(weekStartDate);
          actualDate.setDate(weekStartDate.getDate() + (record.day_of_week - 4 + 7) % 7);
          const dateKey = format(actualDate, 'yyyy-MM-dd');
          
          if (!recordsByDate.has(dateKey)) {
            recordsByDate.set(dateKey, []);
          }
          recordsByDate.get(dateKey)?.push(record);
        });

        // Transform data for this chatter - one row per date
        const excelData = Array.from(recordsByDate.entries()).map(([dateKey, dateRecords]) => {
          const firstRecord = dateRecords[0];
          const weekStartDate = new Date(firstRecord.week_start_date);
          const actualDate = new Date(weekStartDate);
          actualDate.setDate(weekStartDate.getDate() + (firstRecord.day_of_week - 4 + 7) % 7);

          // Combine all model names for this date
          const modelsWorked = dateRecords
            .map(r => r.model_name)
            .filter(m => m)
            .join(', ') || 'N/A';

          return {
            'Week Start': format(new Date(firstRecord.week_start_date), 'MMM dd, yyyy'),
            'Day of Week': dayNames[firstRecord.day_of_week],
            'Date': format(actualDate, 'MMM dd, yyyy'),
            'Attendance': firstRecord.attendance ? 'Present' : 'Absent',
            'Models Worked': modelsWorked,
            'Submitted At': firstRecord.submitted_at ? format(new Date(firstRecord.submitted_at), 'MMM dd, yyyy HH:mm') : 'Not Submitted',
          };
        });

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
      const chatterName = selectedChatterId ? 'Single_Chatter' : 'All_Chatters';
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
      const weekStart = getWeekStart(selectedWeek);
      
      let attendanceQuery = supabase
        .from('attendance')
        .select('*')
        .eq('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .order('day_of_week', { ascending: true });

      if (selectedChatterId) {
        attendanceQuery = attendanceQuery.eq('chatter_id', selectedChatterId);
      }

      const { data: attendanceRecords, error } = await attendanceQuery;

      if (error) throw error;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: 'No Data',
          description: 'No attendance records found for this week.',
          variant: 'destructive',
        });
        return;
      }

      // Get unique chatter IDs
      const chatterIds = [...new Set(attendanceRecords.map(r => r.chatter_id))];

      // Fetch profiles for these chatters
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', chatterIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group attendance records by chatter
      const recordsByChatter = new Map<string, any[]>();
      attendanceRecords.forEach((record: any) => {
        if (!recordsByChatter.has(record.chatter_id)) {
          recordsByChatter.set(record.chatter_id, []);
        }
        recordsByChatter.get(record.chatter_id)?.push(record);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Create a sheet for each chatter
      recordsByChatter.forEach((chatterRecords, chatterId) => {
        const profile = profileMap.get(chatterId);
        const chatterName = profile?.name || 'Unknown';

        // Group records by date (week_start_date + day_of_week)
        const recordsByDate = new Map<string, any[]>();
        chatterRecords.forEach((record: any) => {
          const actualDate = new Date(weekStart);
          actualDate.setDate(weekStart.getDate() + (record.day_of_week - 4 + 7) % 7);
          const dateKey = format(actualDate, 'yyyy-MM-dd');
          
          if (!recordsByDate.has(dateKey)) {
            recordsByDate.set(dateKey, []);
          }
          recordsByDate.get(dateKey)?.push(record);
        });

        // Transform data for this chatter - one row per date
        const excelData = Array.from(recordsByDate.entries()).map(([dateKey, dateRecords]) => {
          const firstRecord = dateRecords[0];
          const actualDate = new Date(weekStart);
          actualDate.setDate(weekStart.getDate() + (firstRecord.day_of_week - 4 + 7) % 7);

          // Combine all model names for this date
          const modelsWorked = dateRecords
            .map(r => r.model_name)
            .filter(m => m)
            .join(', ') || 'N/A';

          return {
            'Week Start': format(new Date(firstRecord.week_start_date), 'MMM dd, yyyy'),
            'Day of Week': dayNames[firstRecord.day_of_week],
            'Date': format(actualDate, 'MMM dd, yyyy'),
            'Attendance': firstRecord.attendance ? 'Present' : 'Absent',
            'Models Worked': modelsWorked,
            'Submitted At': firstRecord.submitted_at ? format(new Date(firstRecord.submitted_at), 'MMM dd, yyyy HH:mm') : 'Not Submitted',
          };
        });

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
      const chatterName = selectedChatterId ? 'Single_Chatter' : 'All_Chatters';
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
