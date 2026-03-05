
CREATE OR REPLACE FUNCTION public.search_products_by_text(
  query_vector text,
  search_text text,
  result_limit integer DEFAULT 20
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
LANGUAGE sql
STABLE
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
        CASE WHEN p.name ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.sku ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.barcode ILIKE '%' || search_text || '%' THEN 1.0 ELSE 0.0 END,
        CASE WHEN p.brand ILIKE '%' || search_text || '%' THEN 0.6 ELSE 0.0 END,
        CASE WHEN p.category ILIKE '%' || search_text || '%' THEN 0.5 ELSE 0.0 END
      ) +
      0.5 * CASE
        WHEN p.text_embedding IS NOT NULL THEN
          (1.0 - (p.text_embedding::vector(1536) <=> query_vector::vector(1536)))
        ELSE 0.0
      END
    ) AS score
  FROM products_master p
  WHERE p.is_active = true
    AND (
      p.text_embedding IS NOT NULL
      OR p.name ILIKE '%' || search_text || '%'
      OR p.sku ILIKE '%' || search_text || '%'
      OR p.barcode ILIKE '%' || search_text || '%'
      OR p.brand ILIKE '%' || search_text || '%'
      OR p.category ILIKE '%' || search_text || '%'
    )
  ORDER BY score DESC
  LIMIT result_limit;
$$;
