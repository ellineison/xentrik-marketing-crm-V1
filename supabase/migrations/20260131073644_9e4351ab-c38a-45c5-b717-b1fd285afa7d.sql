-- Create table to store daily words
CREATE TABLE public.gamification_daily_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT,
  part_of_speech TEXT,
  date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gamification_daily_words ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read the daily word
CREATE POLICY "Anyone can read daily words"
ON public.gamification_daily_words
FOR SELECT
TO authenticated
USING (true);

-- Only allow inserts from service role (edge function)
CREATE POLICY "Service role can insert daily words"
ON public.gamification_daily_words
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for fast date lookups
CREATE INDEX idx_daily_words_date ON public.gamification_daily_words(date DESC);