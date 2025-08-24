-- Create RLS policies for voices storage bucket (only the missing ones)
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