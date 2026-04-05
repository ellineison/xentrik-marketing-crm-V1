ALTER TABLE public.gamification_quest_assignments
ADD COLUMN department text DEFAULT NULL;

COMMENT ON COLUMN public.gamification_quest_assignments.department IS 'Department filter: 6AM, 2PM, 10PM, or NULL for all departments';