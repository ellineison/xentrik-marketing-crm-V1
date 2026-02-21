
-- 1. Delete all data for inactive model: Rose Reality (rose-reality-xentrik)
DELETE FROM creator_tags WHERE creator_id = 'rose-reality-xentrik';
DELETE FROM creators WHERE id = 'rose-reality-xentrik';

-- 2. Delete all declined onboarding submissions
DELETE FROM onboarding_submissions WHERE status = 'declined';

-- 3. Delete done/refunded customs and their status history
DELETE FROM custom_status_history WHERE custom_id IN (
  SELECT id FROM customs WHERE status IN ('done', 'refunded')
);
DELETE FROM customs WHERE status IN ('done', 'refunded');
