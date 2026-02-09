
-- Drop the existing check constraint that limits slot_number to 1-3
ALTER TABLE public.gamification_daily_quest_slots 
DROP CONSTRAINT IF EXISTS gamification_daily_quest_slots_slot_number_check;

-- Add a new check constraint that allows:
-- 1-4 for daily quests
-- 100 for weekly quests  
-- 200 for monthly quests
ALTER TABLE public.gamification_daily_quest_slots 
ADD CONSTRAINT gamification_daily_quest_slots_slot_number_check 
CHECK (
  (slot_number >= 1 AND slot_number <= 4) OR  -- Daily slots
  slot_number = 100 OR                         -- Weekly slot
  slot_number = 200                            -- Monthly slot
);
