-- Add attachments column to store screenshot URLs for quest completions
ALTER TABLE public.gamification_quest_completions 
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Add a comment for clarity
COMMENT ON COLUMN public.gamification_quest_completions.attachments IS 'Array of screenshot URLs submitted as proof of quest completion';