-- Allow authenticated users to create their own quest assignments
-- This is needed for the re-roll feature where users create personal assignments
CREATE POLICY "Users can create own quest assignments"
ON gamification_quest_assignments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = assigned_by);