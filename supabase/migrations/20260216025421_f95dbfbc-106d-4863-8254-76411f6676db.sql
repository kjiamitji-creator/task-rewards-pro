
-- Allow public insert/update/delete on social_ads (admin panel uses custom password auth, not Supabase Auth)
CREATE POLICY "Allow public insert social ads"
ON public.social_ads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update social ads"
ON public.social_ads
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete social ads"
ON public.social_ads
FOR DELETE
USING (true);

-- Allow public insert/update/delete on video_ads
CREATE POLICY "Allow public insert video ads"
ON public.video_ads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update video ads"
ON public.video_ads
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete video ads"
ON public.video_ads
FOR DELETE
USING (true);
