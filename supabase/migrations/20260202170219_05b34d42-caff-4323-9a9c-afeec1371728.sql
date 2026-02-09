-- Add game_name column to gamification_quests table
ALTER TABLE public.gamification_quests 
ADD COLUMN game_name TEXT;

-- Update existing quests with game names
UPDATE public.gamification_quests SET game_name = 'Ability Rotation' WHERE title = 'Word of the Day';
UPDATE public.gamification_quests SET game_name = 'First Blood' WHERE title = 'TW to Spender';
UPDATE public.gamification_quests SET game_name = 'Empowered Ability' WHERE title = 'Word of the Day (Naughty Edition)';
UPDATE public.gamification_quests SET game_name = 'Turn the Trade' WHERE title = 'Irate to Sweet';
UPDATE public.gamification_quests SET game_name = 'Out-Trading' WHERE title = 'Budget Buster';
UPDATE public.gamification_quests SET game_name = 'Lane Bait' WHERE title = 'Lifestyle Tip';
UPDATE public.gamification_quests SET game_name = 'Power Spike' WHERE title = 'Surpass $4K Net';
UPDATE public.gamification_quests SET game_name = 'Stacking Passive' WHERE title = 'Laddering Technique';
UPDATE public.gamification_quests SET game_name = 'Tower Pressure' WHERE title = '$69 Locked Messages';

-- Insert new DAILY quests
INSERT INTO public.gamification_quests (title, game_name, description, quest_type, xp_reward, banana_reward, is_active)
VALUES 
  ('Fan Idea That Converts (Non-Whale)', 'Winning the Lane', 'Land a custom sale by pitching a creative theme — not just a basic request. Show strategic creativity to secure the conversion.', 'daily', 50, 10, true),
  ('1,000 Messages in 1 Shift', 'Wave Clear', 'Dominate your lane by clearing 1,000 messages in a single 8-hour shift. Pure volume, pure pressure.', 'daily', 75, 15, true),
  ('Finish Sexting Set', 'Wave Reset', 'Execute the full combo — deploy every piece of media in a sexting set through to the finale.', 'daily', 60, 12, true),
  ('Sell Video as Custom', 'Item Completion', 'Outplay expectations by pitching a pre-existing video as a custom order. Maximum value extraction.', 'daily', 55, 11, true),
  ('Zero Errors Full Shift', 'Perfect Mechanics', 'Flawless execution — complete your entire shift with zero QA flags. Clean gameplay only.', 'daily', 100, 20, true);

-- Insert new WEEKLY quest
INSERT INTO public.gamification_quests (title, game_name, description, quest_type, xp_reward, banana_reward, is_active)
VALUES 
  ('Hit 2 Daily Quests Per Day (Consistency)', 'Lane Dominance', 'Maintain lane control all week — complete at least 2 daily quests every single day for 7 consecutive days.', 'weekly', 250, 50, true);

-- Insert new MONTHLY quests
INSERT INTO public.gamification_quests (title, game_name, description, quest_type, xp_reward, banana_reward, is_active)
VALUES 
  ('4 Consecutive Weeks Hitting Quota', 'Win Condition Secured', 'Lock in the victory — hit $2K sales quota every week for an entire month. Consistent carry performance.', 'monthly', 500, 100, true),
  ('Top Performer (Revenue + Quality)', 'MVP', 'Claim the title of Most Valuable Player — lead in both revenue generation and execution quality for the month.', 'monthly', 750, 150, true),
  ('Zero Critical Errors for the Month', 'No Deaths Run', 'Complete the legendary challenge — survive an entire month without a single critical error. Deathless run achieved.', 'monthly', 600, 120, true);