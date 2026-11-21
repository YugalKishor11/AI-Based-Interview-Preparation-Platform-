-- ==========================================
-- PREPSPHERE MIGRATION 6: 20261121000006_storage_buckets_policies.sql
-- Concern: Private Supabase Storage buckets (resumes & recordings) and object RLS policies
-- ==========================================

-- 1. Create Private Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'resumes',
    'resumes',
    false,
    5242880, -- 5 MB limit
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'recordings',
    'recordings',
    false,
    52428800, -- 50 MB limit
    array[
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Resumes Storage Policies (Path convention: <user_id>/<file_uuid>.<ext>)
create policy resumes_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy resumes_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy resumes_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 3. Recordings Storage Policies (Requires user recordings_enabled AND active consent)
create policy recordings_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy recordings_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
      and p.recordings_enabled = true
    )
    and exists (
      select 1 from public.consents c
      where c.user_id = (select auth.uid())
      and c.kind = 'recording'
      and c.granted = true
    )
  );

create policy recordings_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
