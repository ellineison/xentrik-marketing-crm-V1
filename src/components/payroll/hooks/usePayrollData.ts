import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekStart } from '@/utils/weekCalculations';
import { format } from 'date-fns';

interface SalesEntry {
  id: string;
  week_start_date: string;
  model_name: string;
  day_of_week: number;
  earnings: number;
  chatter_id: string | null;
}

interface SalesModel {
  id: string;
  model_name: string;
  created_at: string;
}

export const usePayrollData = (selectedWeekStart?: string) => {
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [models, setModels] = useState<SalesModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getWeekStartDate = (): string => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    return format(weekStart, 'yyyy-MM-dd');
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sales data for selected week or current week
      const weekStartDate = selectedWeekStart || getWeekStartDate();
      const { data: salesData, error: salesError } = await supabase
        .from('sales_tracker')
        .select('*')
        .eq('week_start_date', weekStartDate);

      if (salesError) {
        console.error('Error fetching sales data:', salesError);
        return;
      }

      // Get unique models from sales data
      const uniqueModelNames = Array.from(
        new Set(salesData?.map(s => s.model_name) || [])
      );
      
      const modelsWithIds = uniqueModelNames.map(name => ({
        id: `model-${name}`,
        model_name: name,
        created_at: new Date().toISOString()
      }));

      setModels(modelsWithIds);
      setSalesData(salesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWeekStart]);

  return {
    salesData,
    models,
    isLoading,
    refetch: fetchData,
  };
};