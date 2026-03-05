
-- Create raw-images bucket for intake
INSERT INTO storage.buckets (id, name, public)
VALUES ('raw-images', 'raw-images', false)
ON CONFLICT (id) DO NOTHING;

-- Admin-only upload to raw-images
CREATE POLICY "Admins can upload raw images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'raw-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admin-only read from raw-images
CREATE POLICY "Admins can read raw images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'raw-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admin-only delete from raw-images
CREATE POLICY "Admins can delete raw images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'raw-images' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
