-- ============================================================
-- Priority #9: Delivery zones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  cities        TEXT[] NOT NULL DEFAULT '{}',
  base_fee      INTEGER NOT NULL DEFAULT 0,  -- FCFA
  estimated_days TEXT NOT NULL DEFAULT '1-3',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones_public_select"
  ON public.delivery_zones FOR SELECT USING (true);

CREATE POLICY "delivery_zones_admin_all"
  ON public.delivery_zones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Default Cameroon delivery zones
INSERT INTO public.delivery_zones (name, cities, base_fee, estimated_days) VALUES
  ('Yaoundé Centre',    ARRAY['Yaoundé', 'Yaounde'],         1500, '1-2 jours'),
  ('Yaoundé Banlieue', ARRAY['Soa', 'Obala', 'Mfou', 'Mbalmayo', 'Olembé'], 2500, '1-3 jours'),
  ('Douala',           ARRAY['Douala', 'Bonaberi'],           2000, '1-3 jours'),
  ('Reste Cameroun',   ARRAY[]::TEXT[],                       5000, '3-7 jours')
ON CONFLICT DO NOTHING;

-- Add shipping fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES public.delivery_zones(id),
  ADD COLUMN IF NOT EXISTS shipping_fee     INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Priority #10: Promotions / discount scheduler
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  -- scope: NULL product_ids + NULL category = store-wide
  product_ids      UUID[] DEFAULT NULL,
  category         TEXT DEFAULT NULL,
  -- discount: exactly one of these should be set
  discount_percent NUMERIC(5,2) DEFAULT NULL,
  discount_amount  INTEGER DEFAULT NULL,   -- fixed FCFA off
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_public_select"
  ON public.promotions FOR SELECT USING (true);

CREATE POLICY "promotions_admin_all"
  ON public.promotions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================
-- Priority #15: Coupon / discount codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  description      TEXT,
  discount_percent NUMERIC(5,2) DEFAULT NULL,
  discount_amount  INTEGER DEFAULT NULL,    -- fixed FCFA off
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_uses         INTEGER DEFAULT NULL,    -- NULL = unlimited
  uses_count       INTEGER NOT NULL DEFAULT 0,
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ DEFAULT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (for validation at checkout)
CREATE POLICY "coupons_public_select"
  ON public.coupons FOR SELECT USING (true);

CREATE POLICY "coupons_admin_all"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Track coupon usage on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id      UUID REFERENCES public.coupons(id),
  ADD COLUMN IF NOT EXISTS coupon_discount INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Accounting tables for Priority #19-22
-- ============================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id   UUID REFERENCES public.accounts(id),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_admin_all"
  ON public.accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Journal (double-entry)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  reference    TEXT,
  description  TEXT NOT NULL,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_admin_all"
  ON public.journal_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Journal Lines
CREATE TABLE IF NOT EXISTS public.journal_lines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  debit      NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit     NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);

ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_lines_admin_all"
  ON public.journal_lines FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed basic Chart of Accounts (OHADA-compatible for Cameroon)
INSERT INTO public.accounts (code, name, type) VALUES
  ('1000', 'Capital Social',            'equity'),
  ('1100', 'Résultat de l''exercice',   'equity'),
  ('2000', 'Immobilisations',           'asset'),
  ('3000', 'Stocks',                    'asset'),
  ('4000', 'Clients',                   'asset'),
  ('4100', 'Fournisseurs',              'liability'),
  ('4200', 'TVA collectée',             'liability'),
  ('4300', 'TVA déductible',            'asset'),
  ('5000', 'Banque',                    'asset'),
  ('5100', 'Caisse',                    'asset'),
  ('6000', 'Achats marchandises',       'expense'),
  ('6100', 'Charges de personnel',      'expense'),
  ('6200', 'Loyers',                    'expense'),
  ('6300', 'Transport',                 'expense'),
  ('6400', 'Charges diverses',          'expense'),
  ('7000', 'Ventes marchandises',       'revenue'),
  ('7100', 'Prestations de services',   'revenue')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- RPC: increment_coupon_uses
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
    SET uses_count = uses_count + 1
  WHERE id = p_coupon_id;
END;
$$;

-- RPC: validate_coupon
-- Returns coupon details if valid, raises exception if not
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_order_amount INTEGER
)
RETURNS TABLE(
  id UUID,
  code TEXT,
  description TEXT,
  discount_percent NUMERIC,
  discount_amount INTEGER,
  min_order_amount INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.code, c.description,
    c.discount_percent, c.discount_amount, c.min_order_amount
  FROM public.coupons c
  WHERE
    c.code = UPPER(p_code)
    AND c.is_active = true
    AND (c.valid_until IS NULL OR c.valid_until > now())
    AND c.valid_from <= now()
    AND (c.max_uses IS NULL OR c.uses_count < c.max_uses)
    AND c.min_order_amount <= p_order_amount
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found or not applicable';
  END IF;
END;
$$;
