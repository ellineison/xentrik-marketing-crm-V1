
CREATE OR REPLACE FUNCTION public.is_quest_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND (
        p.role IN ('Admin','DCR')
        OR p.roles && ARRAY['Admin','DCR']::text[]
      )
  );
$$;

-- gamification_quests
DROP POLICY IF EXISTS "Admins can manage quests" ON public.gamification_quests;
CREATE POLICY "Quest managers can manage quests" ON public.gamification_quests
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_quest_assignments
DROP POLICY IF EXISTS "Admins can manage quest assignments" ON public.gamification_quest_assignments;
CREATE POLICY "Quest managers can manage quest assignments" ON public.gamification_quest_assignments
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_quest_completions
DROP POLICY IF EXISTS "Admins can manage all completions" ON public.gamification_quest_completions;
CREATE POLICY "Quest managers can manage all completions" ON public.gamification_quest_completions
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_shift_quest_assignments
DROP POLICY IF EXISTS "Admins can manage shift quest assignments" ON public.gamification_shift_quest_assignments;
CREATE POLICY "Quest managers can manage shift quest assignments" ON public.gamification_shift_quest_assignments
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_shift_quest_completions
DROP POLICY IF EXISTS "Admins can manage all shift completions" ON public.gamification_shift_quest_completions;
CREATE POLICY "Quest managers can manage all shift completions" ON public.gamification_shift_quest_completions
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_quest_progress (admin-view policy)
DROP POLICY IF EXISTS "Admins can view all quest progress" ON public.gamification_quest_progress;
CREATE POLICY "Quest managers can view all quest progress" ON public.gamification_quest_progress
  FOR SELECT USING (public.is_quest_manager(auth.uid()));

-- gamification_shop_items
DROP POLICY IF EXISTS "Admins can manage shop items" ON public.gamification_shop_items;
CREATE POLICY "Quest managers can manage shop items" ON public.gamification_shop_items
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_ranks
DROP POLICY IF EXISTS "Admins can manage ranks" ON public.gamification_ranks;
CREATE POLICY "Quest managers can manage ranks" ON public.gamification_ranks
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_purchases
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.gamification_purchases;
CREATE POLICY "Quest managers can manage all purchases" ON public.gamification_purchases
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));
DROP POLICY IF EXISTS "Chatters can view own purchases" ON public.gamification_purchases;
CREATE POLICY "Players can view own purchases" ON public.gamification_purchases
  FOR SELECT USING (chatter_id = auth.uid() OR public.is_quest_manager(auth.uid()));

-- gamification_banana_transactions
DROP POLICY IF EXISTS "Admins can manage all banana transactions" ON public.gamification_banana_transactions;
CREATE POLICY "Quest managers can manage all banana transactions" ON public.gamification_banana_transactions
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));
DROP POLICY IF EXISTS "Chatters can view own banana transactions" ON public.gamification_banana_transactions;
CREATE POLICY "Players can view own banana transactions" ON public.gamification_banana_transactions
  FOR SELECT USING (chatter_id = auth.uid() OR public.is_quest_manager(auth.uid()));

-- gamification_xp_transactions
DROP POLICY IF EXISTS "Admins can manage all xp transactions" ON public.gamification_xp_transactions;
CREATE POLICY "Quest managers can manage all xp transactions" ON public.gamification_xp_transactions
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_chatter_stats
DROP POLICY IF EXISTS "Admins can manage all chatter stats" ON public.gamification_chatter_stats;
CREATE POLICY "Quest managers can manage all chatter stats" ON public.gamification_chatter_stats
  FOR ALL USING (public.is_quest_manager(auth.uid()))
  WITH CHECK (public.is_quest_manager(auth.uid()));

-- gamification_daily_quest_slots (admin-view)
DROP POLICY IF EXISTS "Admins can view all daily quest slots" ON public.gamification_daily_quest_slots;
CREATE POLICY "Quest managers can view all daily quest slots" ON public.gamification_daily_quest_slots
  FOR SELECT USING (public.is_quest_manager(auth.uid()));
