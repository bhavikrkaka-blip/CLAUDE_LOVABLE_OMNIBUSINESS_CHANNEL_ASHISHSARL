
-- Enum for location types
CREATE TYPE public.location_type AS ENUM ('warehouse', 'store');

-- Enum for stock movement types
CREATE TYPE public.movement_type AS ENUM ('purchase', 'sale', 'transfer', 'adjustment', 'return');

-- 1. Locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type location_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage locations" ON public.locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Locations are publicly readable" ON public.locations FOR SELECT
  USING (true);

-- Insert default locations
INSERT INTO public.locations (name, type) VALUES
  ('Warehouse', 'warehouse'),
  ('Store 1', 'store'),
  ('Store 2', 'store'),
  ('Store 3', 'store');

-- 2. Products master table (separate from existing products table)
CREATE TABLE public.products_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage products_master" ON public.products_master FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Products master publicly readable" ON public.products_master FOR SELECT
  USING (true);

-- 3. Inventory table
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products_master(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, location_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inventory publicly readable" ON public.inventory FOR SELECT
  USING (true);

-- 4. Stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products_master(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type movement_type NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Stock movements publicly readable" ON public.stock_movements FOR SELECT
  USING (true);

-- Trigger for inventory updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
