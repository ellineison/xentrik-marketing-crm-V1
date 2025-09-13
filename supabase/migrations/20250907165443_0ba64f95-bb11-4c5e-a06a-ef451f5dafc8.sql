-- Create table for storing generated voice clones
CREATE TABLE public.generated_voice_clones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  emotion TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_voice_clones ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can view their own generated voice clones
CREATE POLICY "Users can view their own generated voice clones" 
ON public.generated_voice_clones 
FOR SELECT 
USING (auth.uid() = generated_by);

-- Users can insert their own generated voice clones
CREATE POLICY "Users can insert their own generated voice clones" 
ON public.generated_voice_clones 
FOR INSERT 
WITH CHECK (auth.uid() = generated_by);

-- Users can update their own generated voice clones
CREATE POLICY "Users can update their own generated voice clones" 
ON public.generated_voice_clones 
FOR UPDATE 
USING (auth.uid() = generated_by);

-- Users can delete their own generated voice clones
CREATE POLICY "Users can delete their own generated voice clones" 
ON public.generated_voice_clones 
FOR DELETE 
USING (auth.uid() = generated_by);

-- Admins can manage all generated voice clones
CREATE POLICY "Admins can manage all generated voice clones" 
ON public.generated_voice_clones 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_voice_clones_updated_at
BEFORE UPDATE ON public.generated_voice_clones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_generated_voice_clones_generated_by ON public.generated_voice_clones(generated_by);
CREATE INDEX idx_generated_voice_clones_model_emotion ON public.generated_voice_clones(model_name, emotion);
CREATE INDEX idx_generated_voice_clones_created_at ON public.generated_voice_clones(created_at DESC);