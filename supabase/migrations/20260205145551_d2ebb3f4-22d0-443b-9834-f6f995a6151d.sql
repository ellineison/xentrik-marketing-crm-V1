-- Create storage bucket for quest submissions if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quest-submissions', 'quest-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own quest evidence
CREATE POLICY "Users can upload their own quest evidence" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quest-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to view quest evidence
CREATE POLICY "Quest evidence is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quest-submissions');

-- Create policy for users to delete their own quest evidence
CREATE POLICY "Users can delete their own quest evidence" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quest-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create a table to track individual quest progress uploads (before final submission)
CREATE TABLE IF NOT EXISTS public.gamification_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_assignment_id UUID NOT NULL REFERENCES public.gamification_quest_assignments(id) ON DELETE CASCADE,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  attachment_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quest_assignment_id, chatter_id, slot_number)
);

-- Enable RLS
ALTER TABLE public.gamification_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for quest progress
CREATE POLICY "Users can view their own quest progress"
ON public.gamification_quest_progress
FOR SELECT
USING (auth.uid() = chatter_id);

CREATE POLICY "Users can insert their own quest progress"
ON public.gamification_quest_progress
FOR INSERT
WITH CHECK (auth.uid() = chatter_id);

CREATE POLICY "Users can update their own quest progress"
ON public.gamification_quest_progress
FOR UPDATE
USING (auth.uid() = chatter_id);

CREATE POLICY "Users can delete their own quest progress"
ON public.gamification_quest_progress
FOR DELETE
USING (auth.uid() = chatter_id);