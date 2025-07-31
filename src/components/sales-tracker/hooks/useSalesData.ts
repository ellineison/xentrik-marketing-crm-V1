import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useSalesData = (selectedWeekStart?: string) => {
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [models, setModels] = useState<SalesModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7; // 4 = Thursday
    const thursday = new Date(today);
    
    if (dayOfWeek < 4) {
      // If today is before Thursday, go to last Thursday
      thursday.setDate(today.getDate() - (7 - daysUntilThursday));
    } else {
      // If today is Thursday or after, go to this Thursday
      thursday.setDate(today.getDate() - daysUntilThursday);
    }
    
    return thursday.toISOString().split('T')[0];
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

      // Extract unique models from sales data for this specific week
      const uniqueModelNames = [...new Set((salesData || []).map(entry => entry.model_name))];
      const weekModels = uniqueModelNames.map(modelName => ({
        id: modelName, // Using model name as ID for this week
        model_name: modelName,
        created_at: new Date().toISOString()
      })).sort((a, b) => a.model_name.localeCompare(b.model_name));

      setModels(weekModels);
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