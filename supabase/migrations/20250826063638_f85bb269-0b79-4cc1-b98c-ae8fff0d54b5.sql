-- Migrate existing attendance data from sales_tracker to attendance table
INSERT INTO public.attendance (chatter_id, model_name, day_of_week, week_start_date, attendance, created_at, updated_at)
SELECT DISTINCT
  chatter_id,
  model_name,
  day_of_week,
  week_start_date,
  attendance,
  created_at,
  updated_at
FROM public.sales_tracker
WHERE attendance = true
AND chatter_id IS NOT NULL
ON CONFLICT (chatter_id, model_name, day_of_week, week_start_date) DO NOTHING;