import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWordOfTheDay, DailyWord } from '@/hooks/useWordOfTheDay';
import { getEffectiveGameDate } from '@/utils/gameDate';

interface EffectiveWord {
  word: string;
  description: string | null;
  isCustom: boolean;
}

/**
 * Hook to get the effective word for a quest.
 * Checks for admin-defined custom_word on the assignment first,
 * then falls back to the standard Word of the Day.
 */
export const useEffectiveWord = (questId?: string) => {
  const { dailyWord, isLoading: dailyWordLoading } = useWordOfTheDay();
  const [customWord, setCustomWord] = useState<{ word: string; description: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomWord = async () => {
      if (!questId) {
        setIsLoading(false);
        return;
      }

      try {
        const today = getEffectiveGameDate();
        
        // Look for admin assignment with custom_word for this quest today
        const { data, error } = await supabase
          .from('gamification_quest_assignments')
          .select('custom_word, custom_word_description')
          .eq('quest_id', questId)
          .lte('start_date', today)
          .gte('end_date', today)
          .is('assigned_by', null) // Admin assignment only
          .not('custom_word', 'is', null)
          .maybeSingle();

        if (!error && data?.custom_word) {
          setCustomWord({
            word: data.custom_word,
            description: data.custom_word_description,
          });
        }
      } catch (err) {
        console.error('Error fetching custom word:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomWord();
  }, [questId]);

  const effectiveWord: EffectiveWord | null = customWord
    ? { word: customWord.word, description: customWord.description, isCustom: true }
    : dailyWord
    ? { word: dailyWord.word, description: dailyWord.definition, isCustom: false }
    : null;

  return {
    effectiveWord,
    isLoading: isLoading || dailyWordLoading,
  };
};
