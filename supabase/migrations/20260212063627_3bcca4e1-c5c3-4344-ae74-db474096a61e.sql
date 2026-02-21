UPDATE gamification_ranks SET min_xp = 0, max_xp = 99 WHERE name = 'Plastic';
UPDATE gamification_ranks SET min_xp = 100, max_xp = 199 WHERE name = 'Wood';
UPDATE gamification_ranks SET min_xp = 200, max_xp = 399 WHERE name = 'Iron';
UPDATE gamification_ranks SET min_xp = 400, max_xp = 699 WHERE name = 'Bronze';
UPDATE gamification_ranks SET min_xp = 700, max_xp = 999 WHERE name = 'Silver';
UPDATE gamification_ranks SET min_xp = 1000, max_xp = 1499 WHERE name = 'Gold';
UPDATE gamification_ranks SET min_xp = 1500, max_xp = 1999 WHERE name = 'Platinum';
UPDATE gamification_ranks SET min_xp = 2000, max_xp = NULL WHERE name = 'Diamond';