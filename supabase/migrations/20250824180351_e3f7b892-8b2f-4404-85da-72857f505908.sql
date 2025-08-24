-- Add attendance column to sales_tracker table
ALTER TABLE public.sales_tracker 
ADD COLUMN attendance boolean DEFAULT false;