-- Create voice_sources table for voice cloning module
CREATE TABLE public.voice_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('sexual', 'angry', 'excited', 'sweet', 'sad', 'conversational')),
  bucket_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.voice_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to SELECT
CREATE POLICY "Authenticated users can view voice sources" 
ON public.voice_sources 
FOR SELECT 
TO authenticated
USING (true);

-- RLS Policy: Only admins can INSERT
CREATE POLICY "Only admins can insert voice sources" 
ON public.voice_sources 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

-- RLS Policy: Only admins can UPDATE
CREATE POLICY "Only admins can update voice sources" 
ON public.voice_sources 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

-- RLS Policy: Only admins can DELETE
CREATE POLICY "Only admins can delete voice sources" 
ON public.voice_sources 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

-- Create storage bucket for voices
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voices', 'voices', false);

-- Storage RLS policies for voices bucket
CREATE POLICY "Authenticated users can view voice files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'voices');

CREATE POLICY "Only admins can upload voice files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'voices' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

CREATE POLICY "Only admins can delete voice files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'voices' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_voice_sources_updated_at
BEFORE UPDATE ON public.voice_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();