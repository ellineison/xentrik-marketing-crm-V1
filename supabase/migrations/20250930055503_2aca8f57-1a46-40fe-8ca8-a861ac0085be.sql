-- Add submitted_at column to attendance table to track submission timestamps
ALTER TABLE public.attendance 
ADD COLUMN submitted_at timestamp with time zone;