-- Create RLS policies for voice_sources table
CREATE POLICY "Authenticated users can insert voice sources" 
ON public.voice_sources 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view voice sources" 
ON public.voice_sources 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete voice sources" 
ON public.voice_sources 
FOR DELETE 
TO authenticated 
USING (true);

-- Create RLS policies for voices storage bucket
CREATE POLICY "Authenticated users can upload to voices bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'voices');

CREATE POLICY "Authenticated users can view voices bucket" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'voices');

CREATE POLICY "Authenticated users can delete from voices bucket" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'voices');