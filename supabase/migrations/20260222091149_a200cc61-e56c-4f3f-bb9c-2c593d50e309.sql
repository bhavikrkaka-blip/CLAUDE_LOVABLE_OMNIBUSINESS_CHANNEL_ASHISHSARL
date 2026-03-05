
CREATE OR REPLACE FUNCTION public.process_stock_audit(
  p_location_id uuid,
  p_reference text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item jsonb;
  v_product_id uuid;
  v_physical_qty integer;
  v_system_qty integer;
  v_diff integer;
  v_adjustments integer := 0;
BEGIN
  -- Validate location exists
  IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id) THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_physical_qty := (v_item->>'physical_quantity')::integer;

    -- Validate product exists
    IF NOT EXISTS (SELECT 1 FROM public.products_master WHERE id = v_product_id) THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    -- Get current system quantity (lock row)
    SELECT COALESCE(quantity, 0) INTO v_system_qty
    FROM public.inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_system_qty IS NULL THEN
      v_system_qty := 0;
    END IF;

    v_diff := v_physical_qty - v_system_qty;

    IF v_diff > 0 THEN
      -- Positive adjustment
      INSERT INTO public.stock_movements (product_id, movement_type, to_location_id, quantity, reference_id)
      VALUES (v_product_id, 'adjustment', p_location_id, v_diff, p_reference);
      v_adjustments := v_adjustments + 1;

    ELSIF v_diff < 0 THEN
      -- Negative adjustment
      INSERT INTO public.stock_movements (product_id, movement_type, from_location_id, quantity, reference_id)
      VALUES (v_product_id, 'adjustment', p_location_id, ABS(v_diff), p_reference);
      v_adjustments := v_adjustments + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'location_id', p_location_id,
    'adjustments_made', v_adjustments
  );
END;
$$;
