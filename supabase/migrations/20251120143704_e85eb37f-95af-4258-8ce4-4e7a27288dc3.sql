-- Sync Secure Logins with Creators module
-- Delete social_media_logins entries where creator doesn't exist in creators table

DELETE FROM social_media_logins
WHERE creator_email NOT IN (
  SELECT DISTINCT email 
  FROM creators 
  WHERE active = true AND email IS NOT NULL
);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Secure Logins sync completed: removed orphaned entries';
END $$;