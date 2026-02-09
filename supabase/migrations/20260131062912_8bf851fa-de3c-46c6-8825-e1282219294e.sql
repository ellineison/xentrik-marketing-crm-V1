-- =====================================================
-- GAMIFICATION SYSTEM FOR TASKS & REWARDS MODULE
-- =====================================================

-- 1. Ranks table - defines XP thresholds for each rank
CREATE TABLE public.gamification_ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  min_xp INTEGER NOT NULL DEFAULT 0,
  max_xp INTEGER, -- NULL means no upper limit (top rank)
  badge_color TEXT DEFAULT '#808080',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default ranks: Plastic, Wood, Iron, Bronze, Silver, Gold, Platinum, Diamond
INSERT INTO public.gamification_ranks (name, min_xp, max_xp, badge_color, sort_order) VALUES
  ('Plastic', 0, 99, '#9CA3AF', 1),
  ('Wood', 100, 299, '#A78B5B', 2),
  ('Iron', 300, 599, '#71717A', 3),
  ('Bronze', 600, 999, '#CD7F32', 4),
  ('Silver', 1000, 1999, '#C0C0C0', 5),
  ('Gold', 2000, 3999, '#FFD700', 6),
  ('Platinum', 4000, 7999, '#E5E4E2', 7),
  ('Diamond', 8000, NULL, '#B9F2FF', 8);

-- 2. Chatter stats table - tracks XP and banana balance per chatter
CREATE TABLE public.gamification_chatter_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  banana_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chatter_id)
);

-- 3. Quests table - quest definitions (created by admin)
CREATE TABLE public.gamification_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'monthly')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  banana_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Quest assignments - which quests are active for which period
CREATE TABLE public.gamification_quest_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.gamification_quests(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Quest completions - track which chatters completed which quest assignments
CREATE TABLE public.gamification_quest_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_assignment_id UUID NOT NULL REFERENCES public.gamification_quest_assignments(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  bananas_earned INTEGER NOT NULL DEFAULT 0,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  UNIQUE(chatter_id, quest_assignment_id)
);

-- 6. Shop items table - items available in Supply Depot
CREATE TABLE public.gamification_shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  banana_cost INTEGER NOT NULL DEFAULT 0,
  stock INTEGER, -- NULL means unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Purchases table - purchase history with voucher codes
CREATE TABLE public.gamification_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES public.gamification_shop_items(id) ON DELETE CASCADE,
  banana_spent INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'redeemed', 'expired')),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES public.profiles(id),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Transaction history for bananas
CREATE TABLE public.gamification_banana_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for earning, negative for spending
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent')),
  source_type TEXT NOT NULL, -- 'quest_completion', 'purchase', 'admin_adjustment'
  source_id UUID, -- reference to quest_completion or purchase
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. XP history
CREATE TABLE public.gamification_xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'quest_completion', 'admin_adjustment'
  source_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.gamification_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_chatter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_quest_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_banana_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_xp_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Ranks: Everyone can view, only admins can manage
CREATE POLICY "Anyone can view ranks" ON public.gamification_ranks FOR SELECT USING (true);
CREATE POLICY "Admins can manage ranks" ON public.gamification_ranks FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Chatter stats: Chatters can view all (for leaderboard), only update own or admin
CREATE POLICY "Anyone can view chatter stats" ON public.gamification_chatter_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage all chatter stats" ON public.gamification_chatter_stats FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));
CREATE POLICY "Chatters can insert own stats" ON public.gamification_chatter_stats FOR INSERT 
  WITH CHECK (chatter_id = auth.uid());

-- Quests: Everyone can view active, only admins can manage
CREATE POLICY "Anyone can view quests" ON public.gamification_quests FOR SELECT USING (true);
CREATE POLICY "Admins can manage quests" ON public.gamification_quests FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Quest assignments: Everyone can view, only admins can manage
CREATE POLICY "Anyone can view quest assignments" ON public.gamification_quest_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage quest assignments" ON public.gamification_quest_assignments FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Quest completions: Chatters can view all and submit own, admins can manage all
CREATE POLICY "Anyone can view quest completions" ON public.gamification_quest_completions FOR SELECT USING (true);
CREATE POLICY "Chatters can submit own completions" ON public.gamification_quest_completions FOR INSERT 
  WITH CHECK (chatter_id = auth.uid());
CREATE POLICY "Admins can manage all completions" ON public.gamification_quest_completions FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Shop items: Everyone can view, only admins can manage
CREATE POLICY "Anyone can view shop items" ON public.gamification_shop_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage shop items" ON public.gamification_shop_items FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Purchases: Chatters can view own and insert, admins can view and manage all
CREATE POLICY "Chatters can view own purchases" ON public.gamification_purchases FOR SELECT 
  USING (chatter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));
CREATE POLICY "Chatters can make purchases" ON public.gamification_purchases FOR INSERT 
  WITH CHECK (chatter_id = auth.uid());
CREATE POLICY "Admins can manage all purchases" ON public.gamification_purchases FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- Banana transactions: Chatters can view own, admins can view and manage all
CREATE POLICY "Chatters can view own banana transactions" ON public.gamification_banana_transactions FOR SELECT 
  USING (chatter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));
CREATE POLICY "System can insert banana transactions" ON public.gamification_banana_transactions FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "Admins can manage all banana transactions" ON public.gamification_banana_transactions FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- XP transactions: Chatters can view own, admins can view and manage all
CREATE POLICY "Chatters can view own xp transactions" ON public.gamification_xp_transactions FOR SELECT 
  USING (chatter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));
CREATE POLICY "System can insert xp transactions" ON public.gamification_xp_transactions FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "Admins can manage all xp transactions" ON public.gamification_xp_transactions FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR 'Admin' = ANY(roles))));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_chatter_stats_chatter ON public.gamification_chatter_stats(chatter_id);
CREATE INDEX idx_chatter_stats_xp ON public.gamification_chatter_stats(total_xp DESC);
CREATE INDEX idx_quest_assignments_dates ON public.gamification_quest_assignments(start_date, end_date);
CREATE INDEX idx_quest_completions_chatter ON public.gamification_quest_completions(chatter_id);
CREATE INDEX idx_purchases_chatter ON public.gamification_purchases(chatter_id);
CREATE INDEX idx_banana_transactions_chatter ON public.gamification_banana_transactions(chatter_id);
CREATE INDEX idx_xp_transactions_chatter ON public.gamification_xp_transactions(chatter_id);