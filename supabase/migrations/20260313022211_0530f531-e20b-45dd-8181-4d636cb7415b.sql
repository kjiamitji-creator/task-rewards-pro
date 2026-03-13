
-- Add public SELECT and UPDATE policies for app_settings so password-based admin can manage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "Allow public read settings" ON public.app_settings FOR SELECT TO public USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "Allow public update settings" ON public.app_settings FOR UPDATE TO public USING (true);
  END IF;
END $$;
