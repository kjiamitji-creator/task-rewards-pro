
-- Create social_ads table
CREATE TABLE public.social_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  page text NOT NULL DEFAULT 'home',
  duration integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active social ads"
  ON public.social_ads FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage social ads"
  ON public.social_ads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create video_ads table
CREATE TABLE public.video_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  redirect_link text DEFAULT '',
  duration integer NOT NULL DEFAULT 15,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active video ads"
  ON public.video_ads FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage video ads"
  ON public.video_ads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for ads
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_ads;
