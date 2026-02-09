
-- Clean up personal assignments that were incorrectly created
-- These have assigned_by set to non-null user IDs and are NOT admin assignments
-- We keep only assignments where assigned_by IS NULL (admin assignments)

-- Delete all personal assignments (non-admin) for daily quests
-- These were created by the old buggy re-roll flow
DELETE FROM gamification_quest_assignments 
WHERE assigned_by IS NOT NULL;
