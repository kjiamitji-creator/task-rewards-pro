
-- Image ads table
CREATE TABLE public.image_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  redirect_link text DEFAULT '',
  duration integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  frozen_until timestamp with time zone DEFAULT NULL,
  page text NOT NULL DEFAULT 'home',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.image_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select image_ads" ON public.image_ads FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert image_ads" ON public.image_ads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update image_ads" ON public.image_ads FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete image_ads" ON public.image_ads FOR DELETE TO public USING (true);

-- Ad analytics table for tracking clicks, views, skips
CREATE TABLE public.ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  ad_type text NOT NULL DEFAULT 'image',
  event_type text NOT NULL DEFAULT 'view',
  duration_watched integer DEFAULT 0,
  skipped_at integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select ad_analytics" ON public.ad_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert ad_analytics" ON public.ad_analytics FOR INSERT TO public WITH CHECK (true);

-- Enable realtime for ads tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.image_ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_analytics;

-- Storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Allow public upload ad images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'ad-images');
CREATE POLICY "Allow public read ad images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ad-images');
CREATE POLICY "Allow public delete ad images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'ad-images');
