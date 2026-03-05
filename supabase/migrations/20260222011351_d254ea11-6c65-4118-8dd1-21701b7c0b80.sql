
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  contact_person text,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers publicly readable"
  ON public.suppliers FOR SELECT
  USING (true);
