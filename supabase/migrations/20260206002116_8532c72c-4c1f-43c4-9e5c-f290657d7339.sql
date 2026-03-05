-- Fix product_views RLS policy to validate INSERT records are for the authenticated user's session
-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can log product views" ON public.product_views;

-- Create a new policy that validates the user_id matches the authenticated user
-- For anonymous users (session_id only), we allow inserts but user_id must be null
-- For authenticated users, user_id must match auth.uid()
CREATE POLICY "Users can only log their own product views"
ON public.product_views
FOR INSERT
WITH CHECK (
  (user_id IS NULL) OR (user_id = auth.uid())
);