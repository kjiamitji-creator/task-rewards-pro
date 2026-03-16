
-- Re-create the missing profile for existing user
INSERT INTO public.profiles (user_id, name, email, coins, completed_tasks, total_withdrawn, currency, referral_code)
SELECT 
  'b2f16837-3ab4-4a4a-b962-1f0faf5287d4',
  COALESCE((raw_user_meta_data->>'name'), 'User'),
  email,
  0, 0, 0, 'INR',
  upper(substr(md5(random()::text), 1, 8))
FROM auth.users 
WHERE id = 'b2f16837-3ab4-4a4a-b962-1f0faf5287d4'
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, currency, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    'INR',
    upper(substr(md5(random()::text), 1, 8))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
