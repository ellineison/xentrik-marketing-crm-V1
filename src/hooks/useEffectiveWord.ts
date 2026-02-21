import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveGameDate } from '@/utils/gameDate';

interface EffectiveWord {
  word: string;
  description: string | null;
  isCustom: boolean;
}

/**
 * Hook to get the effective word for a quest.
 * Returns the admin-defined custom_word on the assignment.
 * No fallback — admins must set the word when assigning the quest.
 */
export const useEffectiveWord = (questId?: string) => {
  const [effectiveWord, setEffectiveWord] = useState<EffectiveWord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset when questId changes to prevent stale data
    setEffectiveWord(null);
    setIsLoading(true);

    const fetchWord = async () => {
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
          setEffectiveWord({
            word: data.custom_word,
            description: data.custom_word_description,
            isCustom: true,
          });
        }
      } catch (err) {
        console.error('Error fetching custom word:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWord();
  }, [questId]);

  return {
    effectiveWord,
    isLoading,
  };
};
