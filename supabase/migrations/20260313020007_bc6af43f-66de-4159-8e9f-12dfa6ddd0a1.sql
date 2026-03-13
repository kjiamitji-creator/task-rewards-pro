
-- Rewards table (admin creates these)
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_time_minutes INTEGER NOT NULL,
  coin_amount INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read rewards
CREATE POLICY "Anyone can read active rewards" ON public.rewards
  FOR SELECT TO public USING (true);

-- Admins can manage rewards
CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public insert/update/delete for password-based admin
CREATE POLICY "Allow public insert rewards" ON public.rewards
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update rewards" ON public.rewards
  FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete rewards" ON public.rewards
  FOR DELETE TO public USING (true);

-- User reward progress table
CREATE TABLE public.user_reward_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  watch_seconds INTEGER NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

ALTER TABLE public.user_reward_progress ENABLE ROW LEVEL SECURITY;

-- Users can read own progress
CREATE POLICY "Users can read own progress" ON public.user_reward_progress
  FOR SELECT TO public USING (auth.uid() = user_id);

-- Users can insert own progress
CREATE POLICY "Users can insert own progress" ON public.user_reward_progress
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Users can update own progress
CREATE POLICY "Users can update own progress" ON public.user_reward_progress
  FOR UPDATE TO public USING (auth.uid() = user_id);

-- Admins can read all progress
CREATE POLICY "Admins can read all progress" ON public.user_reward_progress
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reward_progress;
