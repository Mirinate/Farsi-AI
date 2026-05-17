-- Run these in Supabase SQL Editor after creating storage buckets in the dashboard

-- 1. Create buckets in the Supabase dashboard (Storage > New Bucket):
--    - agency-logos (public)
--    - documents (private)
--    - avatars (public)

-- 2. Storage RLS policies:

-- agency-logos: anyone can read, only authenticated can upload
CREATE POLICY "Public can view agency logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency-logos');

CREATE POLICY "Admins can upload agency logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agency-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can update agency logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'agency-logos' AND auth.role() = 'authenticated');

-- documents: users can upload their own, admins can read all in their agency
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- avatars: public read, authenticated upload
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
