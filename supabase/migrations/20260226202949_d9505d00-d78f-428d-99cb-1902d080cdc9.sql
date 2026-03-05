
-- Clear old 512-dim text embeddings (incompatible with new 1536-dim)
UPDATE products_master SET text_embedding = NULL WHERE text_embedding IS NOT NULL;

-- Change text_embedding column from vector(512) to vector(1536)
ALTER TABLE products_master ALTER COLUMN text_embedding TYPE vector(1536) USING text_embedding::vector(1536);

-- Update search_products_by_text function to use vector(1536)
CREATE OR REPLACE FUNCTION public.search_products_by_text(query_vector text, search_text text, result_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, sku text, name text, category text, brand text, description text, retail_price numeric, score double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.brand,
    p.description,
    p.retail_price,
    (
      0.5 * (1.0 - (p.text_embedding::vector(1536) <=> query_vector::vector(1536))) +
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
$function$;
