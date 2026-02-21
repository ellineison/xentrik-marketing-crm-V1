import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyWord {
  id: string;
  word: string;
  definition: string | null;
  part_of_speech: string | null;
  date: string;
  created_at: string;
}

export const useWordOfTheDay = () => {
  const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWordOfTheDay = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First try to get today's word from the database
        const { getEffectiveGameDate } = await import('@/utils/gameDate');
        const today = getEffectiveGameDate();
        const { data: existingWord, error: fetchError } = await supabase
          .from('gamification_daily_words')
          .select('*')
          .eq('date', today)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (existingWord) {
          setDailyWord(existingWord as DailyWord);
          setIsLoading(false);
          return;
        }

        // If no word exists for today, call the edge function to generate one
        const { data, error: fnError } = await supabase.functions.invoke('word-of-the-day');
        
        if (fnError) {
          throw fnError;
        }

        setDailyWord(data as DailyWord);
      } catch (err) {
        console.error('Error fetching word of the day:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch word of the day');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWordOfTheDay();
  }, []);

  return { dailyWord, isLoading, error };
};
