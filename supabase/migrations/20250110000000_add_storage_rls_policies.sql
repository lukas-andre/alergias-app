-- Migration: Add RLS Policies for Supabase Storage (scan-images bucket)
-- Part of Task 3: Storage Migration (SCANNER_IMPROVEMENTS.md)
--
-- Security model: Users can only access their own scan images
-- Path structure: {user_id}/{extraction_id}.jpg
--
-- Prerequisites:
-- - Bucket 'scan-images' must exist
-- - Bucket should be private (not public)
-- - File size limit: 10 MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp

-- Policy 1: Users can INSERT (upload) their own images
-- Validates that the user is uploading to their own folder (first path segment = user_id)
CREATE POLICY "Users can upload own scan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can SELECT (view/download) their own images
-- Validates that the user is accessing files from their own folder
CREATE POLICY "Users can view own scan images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can DELETE their own images
-- Validates that the user is deleting files from their own folder
CREATE POLICY "Users can delete own scan images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Documentation
COMMENT ON POLICY "Users can upload own scan images" ON storage.objects IS
'RLS policy for scan-images bucket: allows authenticated users to upload images to their own user_id folder';

COMMENT ON POLICY "Users can view own scan images" ON storage.objects IS
'RLS policy for scan-images bucket: allows authenticated users to view/download images from their own user_id folder';

COMMENT ON POLICY "Users can delete own scan images" ON storage.objects IS
'RLS policy for scan-images bucket: allows authenticated users to delete images from their own user_id folder';
