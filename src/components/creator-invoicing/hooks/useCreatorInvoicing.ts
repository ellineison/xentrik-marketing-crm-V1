import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreatorInvoicingEntry, WeekCutoff } from '../types';
import { getWeekStart, getWeekEnd } from '@/utils/weekCalculations';
import { format, addDays, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function useCreatorInvoicing() {
  const [invoicingData, setInvoicingData] = useState<CreatorInvoicingEntry[]>([]);
  const [previousWeekData, setPreviousWeekData] = useState<CreatorInvoicingEntry[]>([]);
  const [creators, setCreators] = useState<{ id: string; name: string; model_name: string | null; default_invoice_number: number | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    // Default to current week (Thursday-Wednesday cutoff)
    return getWeekStart(new Date());
  });
  const { toast } = useToast();

  // Fetch all creators
  const fetchCreators = useCallback(async () => {
    const { data, error } = await supabase
      .from('creators')
      .select('id, name, model_name, default_invoice_number')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching creators:', error);
      return;
    }

    setCreators(data || []);
  }, []);

  // Fetch invoicing data for a specific week
  const fetchInvoicingData = useCallback(async (weekStart: Date) => {
    setLoading(true);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    
    // Calculate previous week start
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = format(prevWeekStart, 'yyyy-MM-dd');

    // Fetch both current and previous week data in parallel
    const [currentResult, prevResult] = await Promise.all([
      supabase
        .from('creator_invoicing')
        .select('*')
        .eq('week_start_date', weekStartStr),
      supabase
        .from('creator_invoicing')
        .select('*')
        .eq('week_start_date', prevWeekStartStr)
    ]);

    if (currentResult.error) {
      console.error('Error fetching invoicing data:', currentResult.error);
      toast({
        title: "Error",
        description: "Failed to load invoicing data",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setInvoicingData((currentResult.data as CreatorInvoicingEntry[]) || []);
    setPreviousWeekData((prevResult.data as CreatorInvoicingEntry[]) || []);
    setLoading(false);
  }, [toast]);

  // Get or create entry for a creator and week
  const getOrCreateEntry = useCallback(async (creatorId: string, modelName: string, weekStart: Date): Promise<CreatorInvoicingEntry | null> => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    
    // Check if entry exists in database first
    const { data: existingEntry, error: fetchError } = await supabase
      .from('creator_invoicing')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing entry:', fetchError);
      return null;
    }

    if (existingEntry) return existingEntry as CreatorInvoicingEntry;

    // Get previous week's percentage and invoice_link to carry forward
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = format(prevWeekStart, 'yyyy-MM-dd');

    const { data: prevData } = await supabase
      .from('creator_invoicing')
      .select('percentage, invoice_link')
      .eq('creator_id', creatorId)
      .eq('week_start_date', prevWeekStartStr)
      .maybeSingle();

    const newEntry = {
      creator_id: creatorId,
      model_name: modelName,
      week_start_date: weekStartStr,
      invoice_payment: false,
      paid: null,
      percentage: prevData?.percentage ?? 50,
      net_sales: null,
      invoice_link: prevData?.invoice_link ?? null,
      statements_image_key: null,
      conversion_image_key: null,
    };

    // Use upsert to avoid duplicate key errors
    const { data, error } = await supabase
      .from('creator_invoicing')
      .upsert(newEntry, { 
        onConflict: 'creator_id,week_start_date',
        ignoreDuplicates: true 
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoicing entry:', error);
      return null;
    }

    // Update local state
    setInvoicingData(prev => [...prev, data as CreatorInvoicingEntry]);
    return data as CreatorInvoicingEntry;
  }, [invoicingData]);

  // Update a field in an entry
  const updateEntry = useCallback(async (
    creatorId: string, 
    weekStartStr: string, 
    field: keyof CreatorInvoicingEntry, 
    value: any
  ) => {
    const { error } = await supabase
      .from('creator_invoicing')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('creator_id', creatorId)
      .eq('week_start_date', weekStartStr);

    if (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
      return false;
    }

    // Update local state
    setInvoicingData(prev => prev.map(entry => 
      entry.creator_id === creatorId && entry.week_start_date === weekStartStr
        ? { ...entry, [field]: value }
        : entry
    ));

    return true;
  }, [toast]);

  // Update percentage for current and all future weeks
  const updatePercentageForward = useCallback(async (
    creatorId: string,
    fromWeekStartStr: string,
    newPercentage: number
  ) => {
    // Update all entries from this week onwards
    const { error } = await supabase
      .from('creator_invoicing')
      .update({ percentage: newPercentage, updated_at: new Date().toISOString() })
      .eq('creator_id', creatorId)
      .gte('week_start_date', fromWeekStartStr);

    if (error) {
      console.error('Error updating percentage:', error);
      toast({
        title: "Error",
        description: "Failed to update percentage",
        variant: "destructive",
      });
      return false;
    }

    // Update local state
    setInvoicingData(prev => prev.map(entry => 
      entry.creator_id === creatorId && entry.week_start_date >= fromWeekStartStr
        ? { ...entry, percentage: newPercentage }
        : entry
    ));

    toast({
      title: "Success",
      description: "Percentage updated for this week and onwards",
    });

    return true;
  }, [toast]);

  // Fetch data for multiple weeks (for checklist view)
  const fetchInvoicingDataRange = useCallback(async (weeks: WeekCutoff[]) => {
    if (weeks.length === 0) return [];

    const startDate = format(weeks[0].weekStart, 'yyyy-MM-dd');
    const endDate = format(weeks[weeks.length - 1].weekStart, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('creator_invoicing')
      .select('*')
      .gte('week_start_date', startDate)
      .lte('week_start_date', endDate)
      .order('week_start_date', { ascending: true });

    if (error) {
      console.error('Error fetching invoicing range:', error);
      return [];
    }

    return (data as CreatorInvoicingEntry[]) || [];
  }, []);

  // Generate week cutoffs - for Invoice Checklist, we generate weeks for the full year(s)
  const generateWeekCutoffs = useCallback((count: number = 12, direction: 'past' | 'future' | 'full-year' = 'past'): WeekCutoff[] => {
    const weeks: WeekCutoff[] = [];
    const today = new Date();
    
    if (direction === 'full-year') {
      // Generate all cutoffs whose DUE DATE falls within each year.
      // This preserves the existing business logic (Thu-Wed cutoff, due date = weekEnd + 1 day)
      // and includes the Jan 1 due date (which belongs to a week that starts in the prior year).
      const startYear = 2026;
      const yearsToGenerate = 3; // 2026, 2027, 2028

      for (let year = startYear; year < startYear + yearsToGenerate; year++) {
        const yearStartDue = new Date(year, 0, 1);
        yearStartDue.setHours(0, 0, 0, 0);

        // First due date in-year is Jan 1; it corresponds to weekEnd = Dec 31 of prior year.
        const weekEndForJan1 = subDays(yearStartDue, 1);
        let weekStart = getWeekStart(weekEndForJan1);

        while (true) {
          const weekEnd = getWeekEnd(weekStart);
          const dueDate = addDays(weekEnd, 1);
          dueDate.setHours(0, 0, 0, 0);

          const dueYear = dueDate.getFullYear();
          if (dueYear > year) break;

          // Guard: skip any spillover due dates from prior year (shouldn't happen, but safe)
          if (dueYear === year) {
            weeks.push({
              weekStart: new Date(weekStart),
              weekEnd,
              dueDate,
              label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
            });
          }

          weekStart.setDate(weekStart.getDate() + 7);
        }
      }
    } else {
      // Original logic for past weeks (used by Invoice Computation)
      const currentWeekStart = getWeekStart(today);

      for (let i = count - 1; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = getWeekEnd(weekStart);
        const dueDate = addDays(weekEnd, 1);
        dueDate.setHours(0, 0, 0, 0);

        weeks.push({
          weekStart,
          weekEnd,
          dueDate,
          label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        });
      }
    }

    return weeks;
  }, []);

  // Update default invoice number for a creator (persists across all weeks)
  const updateDefaultInvoiceNumber = useCallback(async (creatorId: string, invoiceNumber: number) => {
    const { error } = await supabase
      .from('creators')
      .update({ default_invoice_number: invoiceNumber })
      .eq('id', creatorId);

    if (error) {
      console.error('Error updating default invoice number:', error);
      toast({
        title: "Error",
        description: "Failed to update default invoice number",
        variant: "destructive",
      });
      return false;
    }

    // Update local state
    setCreators(prev => prev.map(c => 
      c.id === creatorId ? { ...c, default_invoice_number: invoiceNumber } : c
    ));

    toast({
      title: "Success",
      description: "Default invoice number updated",
    });

    return true;
  }, [toast]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  useEffect(() => {
    fetchInvoicingData(selectedWeekStart);
  }, [selectedWeekStart, fetchInvoicingData]);

  return {
    invoicingData,
    previousWeekData,
    creators,
    loading,
    selectedWeekStart,
    setSelectedWeekStart,
    fetchInvoicingData,
    getOrCreateEntry,
    updateEntry,
    updatePercentageForward,
    updateDefaultInvoiceNumber,
    fetchInvoicingDataRange,
    generateWeekCutoffs,
    refetch: () => fetchInvoicingData(selectedWeekStart),
  };
}
