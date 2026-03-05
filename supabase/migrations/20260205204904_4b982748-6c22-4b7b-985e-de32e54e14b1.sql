-- =============================================
-- ANALYTICS & CMS SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. Click Tracking Table - Stores all user clicks on elements
CREATE TABLE public.click_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    element_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- 'button', 'link', 'banner', 'product', 'category'
    element_label TEXT, -- Human readable label
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    source TEXT, -- 'direct', 'google', 'facebook', 'utm'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Banners/CMS Table - Stores all editable banners
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    placement TEXT NOT NULL UNIQUE, -- 'hero-main', 'hero-secondary', 'category-furniture', 'promo-1', etc.
    title TEXT,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Visitor Sessions Table - Track unique visitors and their journey
CREATE TABLE public.visitor_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    source TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'google', 'facebook', 'referral'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    referrer TEXT,
    landing_page TEXT,
    first_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    page_views INTEGER DEFAULT 1,
    total_clicks INTEGER DEFAULT 0
);

-- 4. Cart Abandonment Tracking - Track items added but not purchased
CREATE TABLE public.cart_abandonment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- 5. Product Analytics - Aggregated product performance metrics
CREATE TABLE public.product_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    add_to_cart_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_purchased_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_abandonment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Click Events Policies
CREATE POLICY "Anyone can insert click events"
ON public.click_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all click events"
ON public.click_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Banners Policies
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert banners"
ON public.banners FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
ON public.banners FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.banners FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Visitor Sessions Policies
CREATE POLICY "Anyone can insert visitor sessions"
ON public.visitor_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their session"
ON public.visitor_sessions FOR UPDATE
USING (true);

CREATE POLICY "Admins can view all sessions"
ON public.visitor_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Cart Abandonment Policies
CREATE POLICY "Anyone can track cart abandonment"
ON public.cart_abandonment FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own abandonment"
ON public.cart_abandonment FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update abandonment status"
ON public.cart_abandonment FOR UPDATE
USING (true);

-- Product Analytics Policies
CREATE POLICY "Anyone can view product analytics"
ON public.product_analytics FOR SELECT
USING (true);

CREATE POLICY "System can insert product analytics"
ON public.product_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update product analytics"
ON public.product_analytics FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_click_events_element ON public.click_events(element_id, element_type);
CREATE INDEX idx_click_events_page ON public.click_events(page_path);
CREATE INDEX idx_click_events_created ON public.click_events(created_at);
CREATE INDEX idx_visitor_sessions_source ON public.visitor_sessions(source);
CREATE INDEX idx_visitor_sessions_device ON public.visitor_sessions(device_type);
CREATE INDEX idx_cart_abandonment_product ON public.cart_abandonment(product_id);
CREATE INDEX idx_cart_abandonment_converted ON public.cart_abandonment(converted);

-- Trigger for updated_at on banners
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default banner placements
INSERT INTO public.banners (placement, title, subtitle, image_url, link_url, button_text, display_order) VALUES
('hero-main', 'Premium Home Appliances', 'Transform your living space with our exclusive collection', '/placeholder.svg', '/products', 'Shop Now', 1),
('hero-secondary', 'New Arrivals', 'Discover the latest in home & kitchen', '/placeholder.svg', '/products?filter=new', 'Explore', 2),
('category-furniture', 'Furniture Collection', 'Quality furniture for every room', '/placeholder.svg', '/products?category=furniture', 'Browse', 1),
('category-appliances', 'Home Appliances', 'Modern appliances for modern homes', '/placeholder.svg', '/products?category=appliances', 'View All', 2),
('promo-1', 'Special Offer', 'Up to 30% off selected items', '/placeholder.svg', '/products?sale=true', 'Shop Sale', 1),
('promo-2', 'Free Delivery', 'On orders over 50,000 FCFA', '/placeholder.svg', '/products', 'Learn More', 2);