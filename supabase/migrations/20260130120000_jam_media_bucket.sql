-- Migration: 20260130120000_jam_media_bucket
-- Description: Add jam-media storage bucket and policies

-- Create jam-media bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('jam-media', 'jam-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for jam media
CREATE POLICY "Jam media are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'jam-media');

-- Allow authenticated users to upload jam media
CREATE POLICY "Users can upload jam media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'jam-media'
    AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own jam media
CREATE POLICY "Users can update their jam media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'jam-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their jam media"
ON storage.objects FOR DELETE
USING (bucket_id = 'jam-media' AND (storage.foldername(name))[1] = auth.uid()::text);
