-- Create featured_products table to store admin-selected promotional products
CREATE TABLE public.featured_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  placement TEXT NOT NULL DEFAULT 'promo_banner',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, placement)
);

-- Enable RLS
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

-- Public can view active featured products
CREATE POLICY "Anyone can view active featured products"
ON public.featured_products
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert featured products
CREATE POLICY "Admins can insert featured products"
ON public.featured_products
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update featured products
CREATE POLICY "Admins can update featured products"
ON public.featured_products
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete featured products
CREATE POLICY "Admins can delete featured products"
ON public.featured_products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_featured_products_updated_at
BEFORE UPDATE ON public.featured_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();