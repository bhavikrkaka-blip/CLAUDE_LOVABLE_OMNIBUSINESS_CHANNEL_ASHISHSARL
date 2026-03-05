
-- Create processed-images bucket for temporary refined images
INSERT INTO storage.buckets (id, name, public)
VALUES ('processed-images', 'processed-images', false)
ON CONFLICT (id) DO NOTHING;

-- Admin-only upload policy
CREATE POLICY "Admins can upload processed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'processed-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admin-only read policy
CREATE POLICY "Admins can read processed images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'processed-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admin-only delete policy
CREATE POLICY "Admins can delete processed images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'processed-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
