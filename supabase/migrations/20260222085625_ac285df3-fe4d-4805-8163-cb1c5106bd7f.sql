
-- Sales table
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.locations(id),
  invoice_number text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  gross_profit numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  sale_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales publicly readable" ON public.sales FOR SELECT
  USING (true);

-- Sale items table
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id),
  product_id uuid NOT NULL REFERENCES public.products_master(id),
  quantity integer NOT NULL,
  selling_price numeric NOT NULL,
  cost_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sale_items" ON public.sale_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sale items publicly readable" ON public.sale_items FOR SELECT
  USING (true);

-- Transactional RPC
CREATE OR REPLACE FUNCTION public.process_sale(
  p_store_id uuid,
  p_invoice_number text,
  p_sale_date date,
  p_payment_method text,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id uuid;
  v_total_amount numeric := 0;
  v_total_cost numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_selling_price numeric;
  v_cost_price numeric;
  v_items_count integer := 0;
BEGIN
  -- Validate store exists and is type 'store'
  IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_store_id AND type = 'store') THEN
    RAISE EXCEPTION 'Store not found or not type store: %', p_store_id;
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('cash', 'card', 'transfer') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', p_payment_method;
  END IF;

  -- First pass: calculate totals and validate products
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_selling_price := (v_item->>'selling_price')::numeric;

    SELECT cost_price INTO v_cost_price FROM public.products_master WHERE id = v_product_id;
    IF v_cost_price IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    v_total_amount := v_total_amount + (v_quantity * v_selling_price);
    v_total_cost := v_total_cost + (v_quantity * v_cost_price);
  END LOOP;

  -- Insert sale
  INSERT INTO public.sales (store_id, invoice_number, total_amount, total_cost, gross_profit, payment_method, sale_date)
  VALUES (p_store_id, p_invoice_number, v_total_amount, v_total_cost, v_total_amount - v_total_cost, p_payment_method, p_sale_date)
  RETURNING id INTO v_sale_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_selling_price := (v_item->>'selling_price')::numeric;

    SELECT cost_price INTO v_cost_price FROM public.products_master WHERE id = v_product_id;

    -- Insert sale item
    INSERT INTO public.sale_items (sale_id, product_id, quantity, selling_price, cost_price)
    VALUES (v_sale_id, v_product_id, v_quantity, v_selling_price, v_cost_price);

    -- Insert stock movement (triggers inventory engine)
    INSERT INTO public.stock_movements (product_id, movement_type, from_location_id, quantity, reference_id)
    VALUES (v_product_id, 'sale', p_store_id, v_quantity, v_sale_id::text);

    v_items_count := v_items_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'total_amount', v_total_amount,
    'total_cost', v_total_cost,
    'gross_profit', v_total_amount - v_total_cost,
    'items_processed', v_items_count
  );
END;
$$;
