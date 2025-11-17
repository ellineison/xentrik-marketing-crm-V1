-- Delete all Elena records manually
-- Delete file_folders first (they reference file_categories)
DELETE FROM file_folders WHERE creator_id = '83dae87e-b8f6-4aa7-8c31-54c5cdf9c280';

-- Delete file_categories
DELETE FROM file_categories WHERE creator = '83dae87e-b8f6-4aa7-8c31-54c5cdf9c280';

-- Delete creator_social_links
DELETE FROM creator_social_links WHERE creator_id = '83dae87e-b8f6-4aa7-8c31-54c5cdf9c280';

-- Finally delete the creator record
DELETE FROM creators WHERE id = '83dae87e-b8f6-4aa7-8c31-54c5cdf9c280';