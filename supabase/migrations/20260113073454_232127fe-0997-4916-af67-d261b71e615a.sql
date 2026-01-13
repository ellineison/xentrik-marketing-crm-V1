-- Add new columns to creator_invoicing table for statements and conversion images
ALTER TABLE public.creator_invoicing 
ADD COLUMN IF NOT EXISTS statements_image_key text,
ADD COLUMN IF NOT EXISTS conversion_image_key text;

-- Add default_invoice_number column to creators table (the model's permanent invoice number)
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS default_invoice_number integer;

-- Create storage bucket for invoicing documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoicing_documents', 'invoicing_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the invoicing_documents bucket
CREATE POLICY "Admins can manage all invoicing documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'invoicing_documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
  )
)
WITH CHECK (
  bucket_id = 'invoicing_documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
  )
);

CREATE POLICY "Authenticated users can view invoicing documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoicing_documents' 
  AND auth.role() = 'authenticated'
);