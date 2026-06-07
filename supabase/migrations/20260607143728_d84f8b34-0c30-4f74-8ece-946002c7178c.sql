CREATE POLICY "Quest managers can delete daily quest slots"
ON public.gamification_daily_quest_slots
FOR DELETE
USING (public.is_quest_manager(auth.uid()));

CREATE POLICY "Users can delete their own daily quest slots"
ON public.gamification_daily_quest_slots
FOR DELETE
USING (auth.uid() = chatter_id);