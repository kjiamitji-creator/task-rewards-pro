
-- Add page column to video_ads
ALTER TABLE public.video_ads ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT 'home';

-- Create storage bucket for ad videos
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-videos', 'ad-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read ad videos
CREATE POLICY "Anyone can read ad videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-videos');

-- Allow authenticated users to upload (admin will handle via RLS on video_ads table)
CREATE POLICY "Authenticated users can upload ad videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-videos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete ad videos
CREATE POLICY "Authenticated users can delete ad videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-videos' AND auth.uid() IS NOT NULL);
