
-- Drop restrictive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload ad videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ad videos" ON storage.objects;

-- Allow anyone to upload to ad-videos bucket (admin panel uses password auth, not Supabase auth)
CREATE POLICY "Anyone can upload ad videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-videos');

-- Allow anyone to delete from ad-videos bucket
CREATE POLICY "Anyone can delete ad videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-videos');

-- Allow anyone to update ad-videos bucket
CREATE POLICY "Anyone can update ad videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-videos');
