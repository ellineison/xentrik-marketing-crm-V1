-- Add status column to generated_voice_clones table
ALTER TABLE public.generated_voice_clones 
ADD COLUMN status TEXT NOT NULL DEFAULT 'Success';

-- Add check constraint for valid status values
ALTER TABLE public.generated_voice_clones 
ADD CONSTRAINT generated_voice_clones_status_check 
CHECK (status IN ('Pending', 'Success', 'Failed'));