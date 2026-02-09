-- Remove the shift column from quest assignments
-- Quests assigned for the day are now available to everyone
ALTER TABLE public.gamification_quest_assignments DROP COLUMN IF EXISTS shift;