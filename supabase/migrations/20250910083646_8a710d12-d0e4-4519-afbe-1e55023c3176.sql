-- Add foreign key constraint between generated_voice_clones.generated_by and profiles.id
ALTER TABLE public.generated_voice_clones 
ADD CONSTRAINT fk_generated_voice_clones_generated_by 
FOREIGN KEY (generated_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;