-- Create a dedicated attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  attendance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(chatter_id, model_name, day_of_week, week_start_date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies similar to sales_tracker
CREATE POLICY "Admins can manage all attendance data" 
ON public.attendance 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
));

CREATE POLICY "Chatters can manage their own attendance data" 
ON public.attendance 
FOR ALL 
USING (
  chatter_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'Chatter' OR 'Chatter' = ANY(profiles.roles))
  )
)
WITH CHECK (
  chatter_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'Chatter' OR 'Chatter' = ANY(profiles.roles))
  )
);

CREATE POLICY "VAs can view all attendance data" 
ON public.attendance 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (profiles.role = 'VA' OR 'VA' = ANY(profiles.roles))
));

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();