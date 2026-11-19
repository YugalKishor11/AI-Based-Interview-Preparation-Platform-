-- ==========================================
-- PREPSPHERE STORAGE BUCKETS: 20261119000003_storage_buckets.sql
-- Private buckets with strict per-user folder isolation
-- ==========================================

-- 1. Create Private Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'resumes',
    'resumes',
    false,
    5242880, -- 5 MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  ),
  (
    'recordings',
    'recordings',
    false,
    26214400, -- 25 MB limit
    ARRAY['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for Resumes Bucket
CREATE POLICY "Candidates access own resume files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates upload own resume files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates delete own resume files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Storage RLS Policies for Recordings Bucket
CREATE POLICY "Candidates access own audio recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates upload own audio recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates delete own audio recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role full access for maintenance & retention sweeps
CREATE POLICY "Service role manages storage objects"
  ON storage.objects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
