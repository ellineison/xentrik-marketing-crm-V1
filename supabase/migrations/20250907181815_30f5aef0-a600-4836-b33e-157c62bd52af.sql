-- Enable realtime for generated_voice_clones table
ALTER TABLE public.generated_voice_clones REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already added
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'generated_voice_clones'
  ) THEN
    -- Add the table to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_voice_clones;
  END IF;
END $$;