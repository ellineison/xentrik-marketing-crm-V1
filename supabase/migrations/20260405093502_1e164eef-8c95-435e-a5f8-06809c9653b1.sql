
-- Shift quest assignments: one row per quest × shift × date
CREATE TABLE public.gamification_shift_quest_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.gamification_quests(id) ON DELETE CASCADE,
  shift TEXT NOT NULL CHECK (shift IN ('6AM', '2PM', '10PM')),
  date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (quest_id, shift, date)
);

ALTER TABLE public.gamification_shift_quest_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shift quest assignments"
ON public.gamification_shift_quest_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
));

CREATE POLICY "Authenticated users can view shift quest assignments"
ON public.gamification_shift_quest_assignments
FOR SELECT
USING (auth.role() = 'authenticated');

-- Shift quest completions: one submission per user per shift assignment
CREATE TABLE public.gamification_shift_quest_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_assignment_id UUID NOT NULL REFERENCES public.gamification_shift_quest_assignments(id) ON DELETE CASCADE,
  chatter_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  attachments TEXT[] DEFAULT '{}'::text[],
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (shift_assignment_id, chatter_id)
);

ALTER TABLE public.gamification_shift_quest_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all shift completions"
ON public.gamification_shift_quest_completions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
));

CREATE POLICY "Users can submit own shift completions"
ON public.gamification_shift_quest_completions
FOR INSERT
WITH CHECK (chatter_id = auth.uid());

CREATE POLICY "Authenticated users can view shift completions"
ON public.gamification_shift_quest_completions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Index for fast lookups by date and shift
CREATE INDEX idx_shift_assignments_date_shift ON public.gamification_shift_quest_assignments(date, shift);
CREATE INDEX idx_shift_completions_chatter ON public.gamification_shift_quest_completions(chatter_id);
