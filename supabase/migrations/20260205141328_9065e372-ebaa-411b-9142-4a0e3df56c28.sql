-- Add progress_target column to gamification_quests table
-- This allows admins to set how many times a quest needs to be completed (e.g., 3/5)
ALTER TABLE public.gamification_quests 
ADD COLUMN IF NOT EXISTS progress_target integer NOT NULL DEFAULT 1;

-- Add a comment explaining the column
COMMENT ON COLUMN public.gamification_quests.progress_target IS 'Number of completions required for this quest (e.g., 5 means 5/5 progress)';