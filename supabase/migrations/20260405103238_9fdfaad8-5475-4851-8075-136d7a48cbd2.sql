CREATE POLICY "Admins can view all quest progress"
ON public.gamification_quest_progress
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
  )
);