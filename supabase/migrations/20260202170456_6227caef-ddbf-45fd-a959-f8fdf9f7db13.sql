-- Fix remaining quests missing game_name
UPDATE public.gamification_quests SET game_name = 'Empowered Ability' WHERE title LIKE '%Word of the Day%Naughty%';
UPDATE public.gamification_quests SET game_name = 'Power Spike' WHERE title = '$4K Net Sales';
UPDATE public.gamification_quests SET game_name = 'Consistent Carry' WHERE title = 'Consistent $2K Weeks';