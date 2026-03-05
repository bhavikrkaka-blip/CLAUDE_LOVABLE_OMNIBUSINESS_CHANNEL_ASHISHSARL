
-- PART 1: system_settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  allow_negative_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System settings publicly readable" ON public.system_settings
  FOR SELECT USING (true);

-- Ensure only one row via trigger
CREATE OR REPLACE FUNCTION public.prevent_multiple_settings()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.system_settings) >= 1 THEN
    RAISE EXCEPTION 'Only one system_settings row allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_settings_row
  BEFORE INSERT ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_settings();

INSERT INTO public.system_settings (allow_negative_stock) VALUES (true);

-- PART 2: Add is_negative_warning to stock_movements
ALTER TABLE public.stock_movements
  ADD COLUMN is_negative_warning BOOLEAN NOT NULL DEFAULT false;

-- PART 3 & 4 & 5: Inventory engine function
CREATE OR REPLACE FUNCTION public.process_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_allow_negative BOOLEAN;
  v_current_qty INTEGER;
  v_from_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- Fetch system setting
  SELECT allow_negative_stock INTO v_allow_negative FROM public.system_settings LIMIT 1;
  IF v_allow_negative IS NULL THEN
    v_allow_negative := true;
  END IF;

  -- Validate movement combinations
  CASE NEW.movement_type
    WHEN 'purchase' THEN
      IF NEW.to_location_id IS NULL THEN
        RAISE EXCEPTION 'purchase requires to_location_id';
      END IF;
      IF NEW.from_location_id IS NOT NULL THEN
        RAISE EXCEPTION 'purchase must not have from_location_id';
      END IF;

    WHEN 'sale' THEN
      IF NEW.from_location_id IS NULL THEN
        RAISE EXCEPTION 'sale requires from_location_id';
      END IF;
      IF NEW.to_location_id IS NOT NULL THEN
        RAISE EXCEPTION 'sale must not have to_location_id';
      END IF;

    WHEN 'transfer' THEN
      IF NEW.from_location_id IS NULL OR NEW.to_location_id IS NULL THEN
        RAISE EXCEPTION 'transfer requires both from_location_id and to_location_id';
      END IF;

    WHEN 'adjustment' THEN
      IF NEW.from_location_id IS NULL AND NEW.to_location_id IS NULL THEN
        RAISE EXCEPTION 'adjustment requires at least one location';
      END IF;

    WHEN 'return' THEN
      IF NEW.to_location_id IS NULL THEN
        RAISE EXCEPTION 'return requires to_location_id';
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown movement_type: %', NEW.movement_type;
  END CASE;

  -- PURCHASE: increase to_location
  IF NEW.movement_type = 'purchase' OR NEW.movement_type = 'return' THEN
    -- Lock or create inventory row
    PERFORM 1 FROM public.inventory
      WHERE product_id = NEW.product_id AND location_id = NEW.to_location_id
      FOR UPDATE;

    INSERT INTO public.inventory (product_id, location_id, quantity)
      VALUES (NEW.product_id, NEW.to_location_id, NEW.quantity)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity,
                    updated_at = now();
  END IF;

  -- SALE: decrease from_location
  IF NEW.movement_type = 'sale' THEN
    SELECT quantity INTO v_current_qty FROM public.inventory
      WHERE product_id = NEW.product_id AND location_id = NEW.from_location_id
      FOR UPDATE;

    IF v_current_qty IS NULL THEN v_current_qty := 0; END IF;

    v_new_qty := v_current_qty - NEW.quantity;

    IF v_new_qty < -1000 THEN
      RAISE EXCEPTION 'Hard safety cap: inventory cannot go below -1000';
    END IF;

    IF NOT v_allow_negative AND v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock (% available, % requested)', v_current_qty, NEW.quantity;
    END IF;

    IF v_new_qty < 0 THEN
      NEW.is_negative_warning := true;
    END IF;

    INSERT INTO public.inventory (product_id, location_id, quantity)
      VALUES (NEW.product_id, NEW.from_location_id, -NEW.quantity)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = public.inventory.quantity - NEW.quantity,
                    updated_at = now();
  END IF;

  -- TRANSFER: decrease from, increase to
  IF NEW.movement_type = 'transfer' THEN
    -- Lock from
    SELECT quantity INTO v_from_qty FROM public.inventory
      WHERE product_id = NEW.product_id AND location_id = NEW.from_location_id
      FOR UPDATE;

    IF v_from_qty IS NULL THEN v_from_qty := 0; END IF;

    v_new_qty := v_from_qty - NEW.quantity;

    IF v_new_qty < -1000 THEN
      RAISE EXCEPTION 'Hard safety cap: inventory cannot go below -1000';
    END IF;

    IF NOT v_allow_negative AND v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for transfer (% available, % requested)', v_from_qty, NEW.quantity;
    END IF;

    IF v_new_qty < 0 THEN
      NEW.is_negative_warning := true;
    END IF;

    -- Decrease from
    INSERT INTO public.inventory (product_id, location_id, quantity)
      VALUES (NEW.product_id, NEW.from_location_id, -NEW.quantity)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = public.inventory.quantity - NEW.quantity,
                    updated_at = now();

    -- Increase to (lock)
    PERFORM 1 FROM public.inventory
      WHERE product_id = NEW.product_id AND location_id = NEW.to_location_id
      FOR UPDATE;

    INSERT INTO public.inventory (product_id, location_id, quantity)
      VALUES (NEW.product_id, NEW.to_location_id, NEW.quantity)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity,
                    updated_at = now();
  END IF;

  -- ADJUSTMENT
  IF NEW.movement_type = 'adjustment' THEN
    -- Positive adjustment (to_location)
    IF NEW.to_location_id IS NOT NULL AND NEW.from_location_id IS NULL THEN
      PERFORM 1 FROM public.inventory
        WHERE product_id = NEW.product_id AND location_id = NEW.to_location_id
        FOR UPDATE;

      INSERT INTO public.inventory (product_id, location_id, quantity)
        VALUES (NEW.product_id, NEW.to_location_id, NEW.quantity)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity,
                      updated_at = now();

    -- Negative adjustment (from_location)
    ELSIF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NULL THEN
      SELECT quantity INTO v_current_qty FROM public.inventory
        WHERE product_id = NEW.product_id AND location_id = NEW.from_location_id
        FOR UPDATE;

      IF v_current_qty IS NULL THEN v_current_qty := 0; END IF;
      v_new_qty := v_current_qty - NEW.quantity;

      IF v_new_qty < -1000 THEN
        RAISE EXCEPTION 'Hard safety cap: inventory cannot go below -1000';
      END IF;

      IF NOT v_allow_negative AND v_new_qty < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for adjustment';
      END IF;

      IF v_new_qty < 0 THEN
        NEW.is_negative_warning := true;
      END IF;

      INSERT INTO public.inventory (product_id, location_id, quantity)
        VALUES (NEW.product_id, NEW.from_location_id, -NEW.quantity)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity = public.inventory.quantity - NEW.quantity,
                      updated_at = now();

    -- Both locations (transfer-style adjustment)
    ELSE
      SELECT quantity INTO v_from_qty FROM public.inventory
        WHERE product_id = NEW.product_id AND location_id = NEW.from_location_id
        FOR UPDATE;

      IF v_from_qty IS NULL THEN v_from_qty := 0; END IF;
      v_new_qty := v_from_qty - NEW.quantity;

      IF v_new_qty < -1000 THEN
        RAISE EXCEPTION 'Hard safety cap: inventory cannot go below -1000';
      END IF;

      IF NOT v_allow_negative AND v_new_qty < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for adjustment';
      END IF;

      IF v_new_qty < 0 THEN
        NEW.is_negative_warning := true;
      END IF;

      INSERT INTO public.inventory (product_id, location_id, quantity)
        VALUES (NEW.product_id, NEW.from_location_id, -NEW.quantity)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity = public.inventory.quantity - NEW.quantity,
                      updated_at = now();

      PERFORM 1 FROM public.inventory
        WHERE product_id = NEW.product_id AND location_id = NEW.to_location_id
        FOR UPDATE;

      INSERT INTO public.inventory (product_id, location_id, quantity)
        VALUES (NEW.product_id, NEW.to_location_id, NEW.quantity)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity,
                      updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- PART 6: Trigger
CREATE TRIGGER trg_process_stock_movement
  BEFORE INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.process_stock_movement();
