-- Add missing columns to generated_voice_clones table (without status column)
ALTER TABLE public.generated_voice_clones 
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS job_id text;