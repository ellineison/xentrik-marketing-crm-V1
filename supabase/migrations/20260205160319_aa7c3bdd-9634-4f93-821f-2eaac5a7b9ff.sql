-- Add shift column to gamification_quest_assignments
ALTER TABLE public.gamification_quest_assignments
ADD COLUMN shift TEXT CHECK (shift IN ('6am', '2pm', '10pm'));

-- Add a comment for documentation
COMMENT ON COLUMN public.gamification_quest_assignments.shift IS 'Team shift for the quest assignment: 6am, 2pm, or 10pm';