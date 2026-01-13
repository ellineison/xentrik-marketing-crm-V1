-- Create table for creator invoicing data
CREATE TABLE public.creator_invoicing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  invoice_payment BOOLEAN NOT NULL DEFAULT false,
  paid NUMERIC DEFAULT NULL,
  percentage NUMERIC DEFAULT 50,
  net_sales NUMERIC DEFAULT NULL,
  invoice_number INTEGER DEFAULT NULL,
  invoice_link TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one entry per creator per week
  CONSTRAINT unique_creator_week UNIQUE (creator_id, week_start_date)
);

-- Create index for faster lookups by week
CREATE INDEX idx_creator_invoicing_week ON public.creator_invoicing(week_start_date);
CREATE INDEX idx_creator_invoicing_creator ON public.creator_invoicing(creator_id);

-- Enable Row Level Security
ALTER TABLE public.creator_invoicing ENABLE ROW LEVEL SECURITY;

-- Create policies - Admin only for full access
CREATE POLICY "Admins can manage all creator invoicing data" 
ON public.creator_invoicing 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'Admin'::text) OR ('Admin'::text = ANY (profiles.roles))))))
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'Admin'::text) OR ('Admin'::text = ANY (profiles.roles))))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_invoicing_updated_at
BEFORE UPDATE ON public.creator_invoicing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();