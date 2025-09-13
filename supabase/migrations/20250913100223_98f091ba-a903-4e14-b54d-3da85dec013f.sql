-- Drop the restrictive SELECT policy for generated voice clones
DROP POLICY IF EXISTS "Users can view their own generated voice clones" ON public.generated_voice_clones;

-- Create new policy to allow all authenticated users to view all generated voices
CREATE POLICY "All authenticated users can view all generated voice clones" 
ON public.generated_voice_clones 
FOR SELECT 
USING (auth.role() = 'authenticated');