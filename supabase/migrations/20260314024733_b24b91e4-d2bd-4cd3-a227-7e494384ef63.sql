
-- Add UPI details columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_name text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number text DEFAULT NULL;

-- Add public UPDATE policy for transactions (admin panel uses no auth session)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE TO public USING (true);
  END IF;
END $$;

-- Add public SELECT policy for transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Allow public select transactions" ON public.transactions FOR SELECT TO public USING (true);
  END IF;
END $$;

-- Add public SELECT and UPDATE policy for profiles (for admin panel)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE TO public USING (true);
  END IF;
END $$;

-- Add public DELETE policy for profiles (for admin delete user)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Allow public delete profiles" ON public.profiles FOR DELETE TO public USING (true);
  END IF;
END $$;
