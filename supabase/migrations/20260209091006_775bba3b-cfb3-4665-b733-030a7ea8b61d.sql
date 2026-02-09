-- Update rank XP thresholds based on new progression system
-- Plastic to Wood = 500xp, Wood to Iron = 500xp, Iron to Bronze = 500xp
-- Bronze to Silver = 1000xp, Silver to Gold = 1000xp
-- Gold to Platinum = 1500xp, Platinum to Diamond = 2000xp

UPDATE gamification_ranks SET min_xp = 0, max_xp = 499, updated_at = now() WHERE name = 'Plastic';
UPDATE gamification_ranks SET min_xp = 500, max_xp = 999, updated_at = now() WHERE name = 'Wood';
UPDATE gamification_ranks SET min_xp = 1000, max_xp = 1499, updated_at = now() WHERE name = 'Iron';
UPDATE gamification_ranks SET min_xp = 1500, max_xp = 2499, updated_at = now() WHERE name = 'Bronze';
UPDATE gamification_ranks SET min_xp = 2500, max_xp = 3499, updated_at = now() WHERE name = 'Silver';
UPDATE gamification_ranks SET min_xp = 3500, max_xp = 4999, updated_at = now() WHERE name = 'Gold';
UPDATE gamification_ranks SET min_xp = 5000, max_xp = 6999, updated_at = now() WHERE name = 'Platinum';
UPDATE gamification_ranks SET min_xp = 7000, max_xp = NULL, updated_at = now() WHERE name = 'Diamond';