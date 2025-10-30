-- Delete user sofson44@gmail.com and all related data
DO $$
DECLARE
  user_uuid UUID := 'e5c41214-2278-4b1c-84cc-592c2a1a6c29';
BEGIN
  -- Delete from sales_tracker
  DELETE FROM sales_tracker WHERE chatter_id = user_uuid;
  
  -- Delete from attendance
  DELETE FROM attendance WHERE chatter_id = user_uuid;
  
  -- Delete from generated_voice_clones
  DELETE FROM generated_voice_clones WHERE generated_by = user_uuid;
  
  -- Delete from creator_social_links (creator_id is text type)
  DELETE FROM creator_social_links WHERE creator_id = user_uuid::text;
  
  -- Delete from creators (id is text type)
  DELETE FROM creators WHERE id = user_uuid::text;
  
  -- Delete from profiles
  DELETE FROM profiles WHERE id = user_uuid;
  
  -- Delete from auth.users (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = user_uuid;
  
  RAISE NOTICE 'Successfully deleted user sofson44@gmail.com (%) and all related data', user_uuid;
END $$;