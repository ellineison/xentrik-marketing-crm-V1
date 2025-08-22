-- Drop the incorrect unique constraint that doesn't include chatter_id
-- This constraint prevents multiple chatters from having the same model on the same day
DROP INDEX IF EXISTS sales_tracker_week_start_date_model_name_day_of_week_key;

-- The correct constraint 'sales_tracker_unique_entry' already exists and includes chatter_id
-- It ensures (week_start_date, model_name, day_of_week, chatter_id) is unique
-- This allows multiple chatters to have the same model on the same day