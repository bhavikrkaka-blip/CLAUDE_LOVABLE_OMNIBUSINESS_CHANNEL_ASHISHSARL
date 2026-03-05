
-- 2. Add status and replaced_by columns to sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS replaced_by_sale_id uuid REFERENCES public.sales(id);

-- 3. Create sales_audit_log table
CREATE TABLE public.sales_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id),
  action text NOT NULL,
  snapshot jsonb NOT NULL,
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins and admins can view audit log"
  ON public.sales_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert audit log"
  ON public.sales_audit_log FOR INSERT
  WITH CHECK (true);

-- 4. Create reverse_sale_stock function
CREATE OR REPLACE FUNCTION public.reverse_sale_stock(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_store_id uuid;
  v_item RECORD;
BEGIN
  SELECT store_id INTO v_store_id FROM public.sales WHERE id = p_sale_id;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Sale not found: %', p_sale_id;
  END IF;

  FOR v_item IN
    SELECT product_id, quantity FROM public.sale_items WHERE sale_id = p_sale_id
  LOOP
    INSERT INTO public.stock_movements (
      product_id, movement_type, to_location_id, quantity, reference_id
    ) VALUES (
      v_item.product_id, 'return', v_store_id, v_item.quantity, p_sale_id::text
    );
  END LOOP;
END;
$$;
