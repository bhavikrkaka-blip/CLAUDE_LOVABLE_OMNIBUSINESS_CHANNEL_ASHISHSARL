
-- ============================================================
-- Priority #1: Merge products + products_master into one table
-- All ERP tables (inventory, stock_movements, sale_items,
-- purchase_items) re-point their FKs to products.
-- products_master is dropped at the end.
-- ============================================================


-- ============================================================
-- STEP 1: Add ERP columns to products
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku                      TEXT,
  ADD COLUMN IF NOT EXISTS barcode                  TEXT,
  ADD COLUMN IF NOT EXISTS cost_price               NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wholesale_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retail_price             NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS reorder_level            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active                BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS main_image_path          TEXT,
  ADD COLUMN IF NOT EXISTS duplicate_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS text_embedding           vector(1536),
  ADD COLUMN IF NOT EXISTS image_embedding          vector(512);

-- Populate retail_price from existing price column
UPDATE public.products SET retail_price = price::NUMERIC WHERE retail_price IS NULL;

-- Make retail_price NOT NULL now that it's populated
ALTER TABLE public.products ALTER COLUMN retail_price SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN retail_price SET NOT NULL;

-- ============================================================
-- STEP 2: Unique partial indexes (only enforce when not null)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON public.products(sku) WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique
  ON public.products(barcode) WHERE barcode IS NOT NULL;

-- ============================================================
-- STEP 3: Trigger to keep price (INTEGER) and retail_price
--         (NUMERIC) in sync in both directions
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_product_price()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.retail_price IS NOT NULL AND NEW.price = 0 THEN
      NEW.price := NEW.retail_price::INTEGER;
    END IF;
    IF NEW.retail_price IS NULL OR NEW.retail_price = 0 THEN
      NEW.retail_price := NEW.price::NUMERIC;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.retail_price IS DISTINCT FROM OLD.retail_price THEN
      NEW.price := COALESCE(NEW.retail_price::INTEGER, NEW.price);
    ELSIF NEW.price IS DISTINCT FROM OLD.price THEN
      NEW.retail_price := NEW.price::NUMERIC;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_product_price_trigger ON public.products;
CREATE TRIGGER sync_product_price_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_price();

-- ============================================================
-- STEP 4: Extend payment_method constraint to include mobile_money
--         (POS dropdown already has this option)
-- ============================================================
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_payment_method_check;

ALTER TABLE public.sales
  ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'transfer', 'mobile_money'));

-- ============================================================
-- STEP 5: Merge data from products_master into products
-- 5a – Update existing products matched by name: copy ERP fields
-- ============================================================
UPDATE public.products p
SET
  sku                       = pm.sku,
  barcode                   = pm.barcode,
  cost_price                = pm.cost_price,
  wholesale_price           = pm.wholesale_price,
  retail_price              = pm.retail_price,
  price                     = pm.retail_price::INTEGER,
  reorder_level             = pm.reorder_level,
  is_active                 = pm.is_active,
  text_embedding            = pm.text_embedding,
  image_embedding           = pm.image_embedding,
  main_image_path           = pm.main_image_path,
  duplicate_override_reason = pm.duplicate_override_reason
FROM public.products_master pm
WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pm.name))
  AND p.sku IS NULL;

-- 5b – Insert products_master rows that have no match in products
INSERT INTO public.products (
  name, name_fr, brand, category, description,
  price, retail_price, cost_price, wholesale_price,
  sku, barcode, reorder_level, is_active,
  text_embedding, image_embedding,
  main_image_path, duplicate_override_reason,
  in_stock, is_new, features, features_fr,
  created_at, updated_at
)
SELECT
  pm.name,
  NULL,
  pm.brand,
  pm.category,
  pm.description,
  pm.retail_price::INTEGER,
  pm.retail_price,
  pm.cost_price,
  pm.wholesale_price,
  pm.sku,
  pm.barcode,
  pm.reorder_level,
  pm.is_active,
  pm.text_embedding,
  pm.image_embedding,
  pm.main_image_path,
  pm.duplicate_override_reason,
  true,
  false,
  '{}',
  '{}',
  pm.created_at,
  pm.created_at
FROM public.products_master pm
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pm.name))
);

-- ============================================================
-- STEP 6: Build ID mapping: products_master.id → products.id
-- ============================================================
CREATE TEMP TABLE _pm_to_products AS
SELECT DISTINCT ON (pm.id)
  pm.id   AS master_id,
  p.id    AS product_id
FROM public.products_master pm
JOIN public.products p
  ON LOWER(TRIM(p.name)) = LOWER(TRIM(pm.name))
ORDER BY pm.id, p.created_at ASC;

-- Catch remaining via SKU if name-match missed them
INSERT INTO _pm_to_products (master_id, product_id)
SELECT pm.id, p.id
FROM public.products_master pm
JOIN public.products p ON p.sku = pm.sku
WHERE pm.id NOT IN (SELECT master_id FROM _pm_to_products)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 7: Re-point inventory → products
-- ============================================================
ALTER TABLE public.inventory
  DROP CONSTRAINT IF EXISTS inventory_product_id_fkey;

UPDATE public.inventory i
SET product_id = m.product_id
FROM _pm_to_products m
WHERE i.product_id = m.master_id;

ALTER TABLE public.inventory
  ADD CONSTRAINT inventory_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 8: Re-point stock_movements → products
-- ============================================================
ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

UPDATE public.stock_movements sm
SET product_id = m.product_id
FROM _pm_to_products m
WHERE sm.product_id = m.master_id;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 9: Re-point sale_items → products
-- ============================================================
ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

UPDATE public.sale_items si
SET product_id = m.product_id
FROM _pm_to_products m
WHERE si.product_id = m.master_id;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 10: Re-point purchase_items → products
-- ============================================================
ALTER TABLE public.purchase_items
  DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;

UPDATE public.purchase_items pi
SET product_id = m.product_id
FROM _pm_to_products m
WHERE pi.product_id = m.master_id;

ALTER TABLE public.purchase_items
  ADD CONSTRAINT purchase_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 11: Update process_sale RPC → reads from products
-- Also accepts mobile_money payment method
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_sale(
  p_store_id       uuid,
  p_invoice_number text,
  p_sale_date      date,
  p_payment_method text,
  p_items          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id       uuid;
  v_total_amount  numeric := 0;
  v_total_cost    numeric := 0;
  v_item          jsonb;
  v_product_id    uuid;
  v_quantity      integer;
  v_selling_price numeric;
  v_cost_price    numeric;
  v_items_count   integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.locations WHERE id = p_store_id AND type = 'store'
  ) THEN
    RAISE EXCEPTION 'Store not found or not type store: %', p_store_id;
  END IF;

  IF p_payment_method NOT IN ('cash', 'card', 'transfer', 'mobile_money') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', p_payment_method;
  END IF;

  -- First pass: validate and total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id    := (v_item->>'product_id')::uuid;
    v_quantity      := (v_item->>'quantity')::integer;
    v_selling_price := (v_item->>'selling_price')::numeric;

    SELECT cost_price INTO v_cost_price FROM public.products WHERE id = v_product_id;
    IF v_cost_price IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    v_total_amount := v_total_amount + (v_quantity * v_selling_price);
    v_total_cost   := v_total_cost   + (v_quantity * v_cost_price);
  END LOOP;

  INSERT INTO public.sales (
    store_id, invoice_number, total_amount, total_cost,
    gross_profit, payment_method, sale_date
  )
  VALUES (
    p_store_id, p_invoice_number, v_total_amount, v_total_cost,
    v_total_amount - v_total_cost, p_payment_method, p_sale_date
  )
  RETURNING id INTO v_sale_id;

  -- Second pass: insert items and stock movements
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id    := (v_item->>'product_id')::uuid;
    v_quantity      := (v_item->>'quantity')::integer;
    v_selling_price := (v_item->>'selling_price')::numeric;

    SELECT cost_price INTO v_cost_price FROM public.products WHERE id = v_product_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, selling_price, cost_price)
    VALUES (v_sale_id, v_product_id, v_quantity, v_selling_price, v_cost_price);

    INSERT INTO public.stock_movements (
      product_id, movement_type, from_location_id, quantity, reference_id
    )
    VALUES (v_product_id, 'sale', p_store_id, v_quantity, v_sale_id::text);

    v_items_count := v_items_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'sale_id',        v_sale_id,
    'total_amount',   v_total_amount,
    'total_cost',     v_total_cost,
    'gross_profit',   v_total_amount - v_total_cost,
    'items_processed', v_items_count
  );
END;
$$;

-- ============================================================
-- STEP 12: Update process_purchase RPC → reads from products
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_supplier_id    uuid,
  p_invoice_number text,
  p_purchase_date  date,
  p_items          jsonb,
  p_warehouse_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id uuid;
  v_total_cost  numeric := 0;
  v_item        jsonb;
  v_product_id  uuid;
  v_quantity    integer;
  v_cost        numeric;
  v_items_count integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id) THEN
    RAISE EXCEPTION 'Supplier not found: %', p_supplier_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.locations WHERE id = p_warehouse_id AND type = 'warehouse'
  ) THEN
    RAISE EXCEPTION 'Warehouse not found: %', p_warehouse_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_quantity   := (v_item->>'quantity')::integer;
    v_cost       := (v_item->>'cost_per_unit')::numeric;
    v_total_cost := v_total_cost + (v_quantity * v_cost);
  END LOOP;

  INSERT INTO public.purchases (supplier_id, invoice_number, total_cost, purchase_date)
  VALUES (p_supplier_id, p_invoice_number, v_total_cost, p_purchase_date)
  RETURNING id INTO v_purchase_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::integer;
    v_cost       := (v_item->>'cost_per_unit')::numeric;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = v_product_id) THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    INSERT INTO public.purchase_items (purchase_id, product_id, quantity, cost_per_unit)
    VALUES (v_purchase_id, v_product_id, v_quantity, v_cost);

    INSERT INTO public.stock_movements (
      product_id, movement_type, to_location_id, quantity, reference_id
    )
    VALUES (v_product_id, 'purchase', p_warehouse_id, v_quantity, v_purchase_id::text);

    -- Keep cost_price up-to-date on the unified products table
    UPDATE public.products SET cost_price = v_cost WHERE id = v_product_id;

    v_items_count := v_items_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'purchase_id',    v_purchase_id,
    'total_cost',     v_total_cost,
    'items_processed', v_items_count
  );
END;
$$;

-- ============================================================
-- STEP 13: Update process_stock_audit RPC → reads from products
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_stock_audit(
  p_location_id uuid,
  p_reference   text,
  p_items       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item          jsonb;
  v_product_id    uuid;
  v_physical_qty  integer;
  v_system_qty    integer;
  v_diff          integer;
  v_adjustments   integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id) THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id   := (v_item->>'product_id')::uuid;
    v_physical_qty := (v_item->>'physical_quantity')::integer;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = v_product_id) THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    SELECT COALESCE(quantity, 0) INTO v_system_qty
    FROM public.inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_system_qty IS NULL THEN v_system_qty := 0; END IF;

    v_diff := v_physical_qty - v_system_qty;

    IF v_diff > 0 THEN
      INSERT INTO public.stock_movements (
        product_id, movement_type, to_location_id, quantity, reference_id
      )
      VALUES (v_product_id, 'adjustment', p_location_id, v_diff, p_reference);
      v_adjustments := v_adjustments + 1;

    ELSIF v_diff < 0 THEN
      INSERT INTO public.stock_movements (
        product_id, movement_type, from_location_id, quantity, reference_id
      )
      VALUES (v_product_id, 'adjustment', p_location_id, ABS(v_diff), p_reference);
      v_adjustments := v_adjustments + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'location_id',      p_location_id,
    'adjustments_made', v_adjustments
  );
END;
$$;

-- ============================================================
-- STEP 14: Update search functions → use products table
--          Return retail_price as alias of price for compat
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_products_by_text(
  query_vector  text,
  search_text   text,
  result_limit  integer DEFAULT 20
)
RETURNS TABLE(
  id           uuid,
  sku          text,
  name         text,
  category     text,
  brand        text,
  description  text,
  retail_price numeric,
  score        double precision
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.brand,
    p.description,
    p.retail_price,
    (
      0.5 * GREATEST(
        CASE WHEN p.name     ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.sku      ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.barcode  ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.brand    ILIKE '%' || search_text || '%' THEN 0.6 ELSE 0.0 END,
        CASE WHEN p.category ILIKE '%' || search_text || '%' THEN 0.5 ELSE 0.0 END
      ) +
      0.5 * CASE
        WHEN p.text_embedding IS NOT NULL THEN
          (1.0 - (p.text_embedding::vector(1536) <=> query_vector::vector(1536)))
        ELSE 0.0
      END
    ) AS score
  FROM public.products p
  WHERE p.is_active = true
    AND (
      p.text_embedding IS NOT NULL
      OR p.name     ILIKE '%' || search_text || '%'
      OR p.sku      ILIKE '%' || search_text || '%'
      OR p.barcode  ILIKE '%' || search_text || '%'
      OR p.brand    ILIKE '%' || search_text || '%'
      OR p.category ILIKE '%' || search_text || '%'
    )
  ORDER BY score DESC
  LIMIT result_limit;
$$;

CREATE OR REPLACE FUNCTION public.search_products_by_image(
  query_vector text,
  result_limit integer DEFAULT 10
)
RETURNS TABLE(
  id           uuid,
  sku          text,
  name         text,
  category     text,
  brand        text,
  description  text,
  retail_price numeric,
  score        double precision
)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.brand,
    p.description,
    p.retail_price,
    (1.0 - (p.image_embedding::vector(512) <=> query_vector::vector(512))) AS score
  FROM public.products p
  WHERE p.is_active = true
    AND p.image_embedding IS NOT NULL
  ORDER BY p.image_embedding::vector(512) <=> query_vector::vector(512) ASC
  LIMIT result_limit;
$$;

-- ============================================================
-- STEP 15: Sync in_stock flag from inventory totals
-- ============================================================
UPDATE public.products p
SET in_stock = (
  SELECT COALESCE(SUM(i.quantity), 0) > 0
  FROM public.inventory i
  WHERE i.product_id = p.id
)
WHERE EXISTS (SELECT 1 FROM public.inventory WHERE product_id = p.id);

-- ============================================================
-- STEP 16: Drop products_master (all FKs now point to products)
-- ============================================================
DROP TABLE IF EXISTS public.products_master;
