
-- Purchases table
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  invoice_number text NOT NULL,
  total_cost numeric NOT NULL DEFAULT 0,
  purchase_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage purchases"
  ON public.purchases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Purchases publicly readable"
  ON public.purchases FOR SELECT
  USING (true);

-- Purchase items table
CREATE TABLE public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products_master(id),
  quantity integer NOT NULL,
  cost_per_unit numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage purchase_items"
  ON public.purchase_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Purchase items publicly readable"
  ON public.purchase_items FOR SELECT
  USING (true);

-- Transactional function
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_supplier_id uuid,
  p_invoice_number text,
  p_purchase_date date,
  p_items jsonb,
  p_warehouse_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id uuid;
  v_total_cost numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_cost numeric;
  v_items_count integer := 0;
BEGIN
  -- Validate supplier exists
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'Supplier not found: %', p_supplier_id;
  END IF;

  -- Validate warehouse exists
  IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_warehouse_id AND type = 'warehouse') THEN
    RAISE EXCEPTION 'Warehouse not found: %', p_warehouse_id;
  END IF;

  -- Calculate total cost
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::integer;
    v_cost := (v_item->>'cost_per_unit')::numeric;
    v_total_cost := v_total_cost + (v_quantity * v_cost);
  END LOOP;

  -- Insert purchase
  INSERT INTO public.purchases (supplier_id, invoice_number, total_cost, purchase_date)
  VALUES (p_supplier_id, p_invoice_number, v_total_cost, p_purchase_date)
  RETURNING id INTO v_purchase_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_cost := (v_item->>'cost_per_unit')::numeric;

    -- Validate product exists
    IF NOT EXISTS (SELECT 1 FROM public.products_master WHERE id = v_product_id) THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    -- Insert purchase item
    INSERT INTO public.purchase_items (purchase_id, product_id, quantity, cost_per_unit)
    VALUES (v_purchase_id, v_product_id, v_quantity, v_cost);

    -- Insert stock movement (triggers process_stock_movement)
    INSERT INTO public.stock_movements (product_id, movement_type, to_location_id, quantity, reference_id)
    VALUES (v_product_id, 'purchase', p_warehouse_id, v_quantity, v_purchase_id::text);

    -- Update cost price
    UPDATE public.products_master SET cost_price = v_cost WHERE id = v_product_id;

    v_items_count := v_items_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'total_cost', v_total_cost,
    'items_processed', v_items_count
  );
END;
$$;
