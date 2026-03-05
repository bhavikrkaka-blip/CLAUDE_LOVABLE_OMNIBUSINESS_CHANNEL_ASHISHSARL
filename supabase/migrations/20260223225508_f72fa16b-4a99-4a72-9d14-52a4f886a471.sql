
CREATE OR REPLACE FUNCTION public.search_products_by_text(
  query_vector text,
  search_text text,
  result_limit integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  sku text,
  name text,
  category text,
  brand text,
  description text,
  retail_price numeric,
  score double precision
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
      0.5 * (1.0 - (p.text_embedding::vector(512) <=> query_vector::vector(512))) +
      0.5 * CASE
        WHEN p.name ILIKE '%' || search_text || '%' THEN 1.0
        WHEN p.category ILIKE '%' || search_text || '%' THEN 0.5
        WHEN p.brand ILIKE '%' || search_text || '%' THEN 0.3
        ELSE 0.0
      END
    ) AS score
  FROM products_master p
  WHERE p.is_active = true
    AND p.text_embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT result_limit;
$$;

CREATE OR REPLACE FUNCTION public.search_products_by_image(
  query_vector text,
  result_limit integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  sku text,
  name text,
  category text,
  brand text,
  description text,
  retail_price numeric,
  score double precision
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
  FROM products_master p
  WHERE p.is_active = true
    AND p.image_embedding IS NOT NULL
  ORDER BY p.image_embedding::vector(512) <=> query_vector::vector(512) ASC
  LIMIT result_limit;
$$;
