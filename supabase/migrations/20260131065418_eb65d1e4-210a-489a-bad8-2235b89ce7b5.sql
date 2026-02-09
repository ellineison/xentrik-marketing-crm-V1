-- Insert default daily quests
INSERT INTO public.gamification_quests (title, description, quest_type, xp_reward, banana_reward, is_active) VALUES
('TW to Spender', 'Send a thoughtful message to a spender', 'daily', 10, 5, true),
('Word of the Day', 'Use the word of the day in conversations', 'daily', 10, 5, true),
('Irate to Sweet', 'Convert an irate fan to sweet ideas that they buy into (except whales)', 'daily', 15, 8, true),
('Budget Buster', 'If a fan has a budget and you made them spend more - 1000 messages', 'daily', 20, 10, true),
('$69 Locked Messages', 'Send 6 $69 locked messages in 1 shift - NOT MASS MESSAGE', 'daily', 25, 12, true),
('Word of the Day - Naughty Edition', 'Use the naughty word of the day in conversations', 'daily', 10, 5, true),
('Lifestyle Tip', 'Get a tip for lifestyle (food, shopping, anything SFW)', 'daily', 15, 8, true),
('Laddering Technique', 'Apply the laddering sales technique successfully', 'daily', 20, 10, true);

-- Insert default weekly quest
INSERT INTO public.gamification_quests (title, description, quest_type, xp_reward, banana_reward, is_active) VALUES
('$4K Net Sales', 'Surpass $4,000 in net sales for the week', 'weekly', 100, 50, true);

-- Insert default monthly quest
INSERT INTO public.gamification_quests (title, description, quest_type, xp_reward, banana_reward, is_active) VALUES
('Consistent $2K Weeks', 'Achieve $2,000+ net sales for all weeks in the month', 'monthly', 300, 150, true);