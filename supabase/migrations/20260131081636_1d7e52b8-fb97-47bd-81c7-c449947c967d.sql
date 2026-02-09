-- Table to track daily quest slots assigned to chatters (3 per day)
CREATE TABLE public.gamification_daily_quest_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 3),
  quest_id UUID NOT NULL REFERENCES public.gamification_quests(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  has_rerolled BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chatter_id, slot_number, date)
);

-- Enable RLS
ALTER TABLE public.gamification_daily_quest_slots ENABLE ROW LEVEL SECURITY;

-- Chatters can view their own slots
CREATE POLICY "Users can view their own daily quest slots"
ON public.gamification_daily_quest_slots
FOR SELECT
USING (auth.uid() = chatter_id);

-- Chatters can update their own slots (for re-roll and completion)
CREATE POLICY "Users can update their own daily quest slots"
ON public.gamification_daily_quest_slots
FOR UPDATE
USING (auth.uid() = chatter_id);

-- Service role can insert (for initial assignment)
CREATE POLICY "Service role can insert daily quest slots"
ON public.gamification_daily_quest_slots
FOR INSERT
WITH CHECK (auth.uid() = chatter_id);

-- Admins can view all slots
CREATE POLICY "Admins can view all daily quest slots"
ON public.gamification_daily_quest_slots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))
  )
);

-- Create index for faster lookups
CREATE INDEX idx_daily_quest_slots_chatter_date ON public.gamification_daily_quest_slots(chatter_id, date);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_quest_slots_updated_at
BEFORE UPDATE ON public.gamification_daily_quest_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();