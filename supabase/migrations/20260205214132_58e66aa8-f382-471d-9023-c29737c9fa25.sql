-- Fix overly permissive UPDATE policies on analytics tables
-- Drop the overly permissive UPDATE policies

-- Drop the unsafe visitor_sessions UPDATE policy
DROP POLICY IF EXISTS "Anyone can update their session" ON public.visitor_sessions;

-- Drop the unsafe cart_abandonment UPDATE policy  
DROP POLICY IF EXISTS "System can update abandonment status" ON public.cart_abandonment;

-- Create restricted policy for visitor_sessions: users can only update their own session
-- Using user_id when authenticated, otherwise no client-side updates allowed
CREATE POLICY "Authenticated users can update their own session"
ON public.visitor_sessions
FOR UPDATE
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Create restricted policy for cart_abandonment: only allow admin updates or own records
-- Cart conversion should be handled server-side, but authenticated users can update their own records
CREATE POLICY "Users can update their own cart abandonment"
ON public.cart_abandonment
FOR UPDATE
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Add admin override for both tables so admins can manage analytics
CREATE POLICY "Admins can update visitor sessions"
ON public.visitor_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cart abandonment"
ON public.cart_abandonment
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));