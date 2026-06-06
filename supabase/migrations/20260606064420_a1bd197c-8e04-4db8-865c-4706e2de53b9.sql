
CREATE TABLE public.payroll_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatter_id uuid NOT NULL,
  week_start_date date NOT NULL,
  -- Locked snapshot (set when chatter locks payroll)
  locked_total_sales numeric NOT NULL DEFAULT 0,
  locked_hours_worked numeric NOT NULL DEFAULT 0,
  locked_hourly_rate numeric NOT NULL DEFAULT 0,
  locked_commission_rate numeric NOT NULL DEFAULT 0,
  locked_hourly_pay numeric NOT NULL DEFAULT 0,
  locked_commission_amount numeric NOT NULL DEFAULT 0,
  expected_salary numeric NOT NULL DEFAULT 0,
  locked_at timestamptz,
  -- Admin approval fields (set when admin confirms)
  overtime_pay numeric,
  overtime_notes text,
  bonus_amount numeric,
  bonus_notes text,
  deduction_amount numeric,
  deduction_notes text,
  approved_salary numeric,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_summaries_chatter_week_unique UNIQUE (chatter_id, week_start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_summaries TO authenticated;
GRANT ALL ON public.payroll_summaries TO service_role;

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user has one of the admin-like roles by reading profiles
CREATE OR REPLACE FUNCTION public.is_payroll_admin(_user_id uuid)
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
        p.role IN ('Admin', 'HR / Work Force', 'VA', 'Manager')
        OR p.roles && ARRAY['Admin','HR / Work Force','VA','Manager']::text[]
      )
  );
$$;

CREATE POLICY "Chatters can view own payroll summary"
  ON public.payroll_summaries
  FOR SELECT
  TO authenticated
  USING (chatter_id = auth.uid() OR public.is_payroll_admin(auth.uid()));

CREATE POLICY "Admins manage payroll summaries"
  ON public.payroll_summaries
  FOR ALL
  TO authenticated
  USING (public.is_payroll_admin(auth.uid()))
  WITH CHECK (public.is_payroll_admin(auth.uid()));

-- Allow the chatter themselves to insert/update their own locked snapshot
-- (so the LockSalesButton write succeeds for non-admin chatters).
CREATE POLICY "Chatters upsert own locked snapshot"
  ON public.payroll_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (chatter_id = auth.uid());

CREATE POLICY "Chatters update own locked snapshot"
  ON public.payroll_summaries
  FOR UPDATE
  TO authenticated
  USING (chatter_id = auth.uid() AND (approved_salary IS NULL))
  WITH CHECK (chatter_id = auth.uid() AND (approved_salary IS NULL));

CREATE TRIGGER update_payroll_summaries_updated_at
  BEFORE UPDATE ON public.payroll_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payroll_summaries_chatter_week
  ON public.payroll_summaries (chatter_id, week_start_date);
