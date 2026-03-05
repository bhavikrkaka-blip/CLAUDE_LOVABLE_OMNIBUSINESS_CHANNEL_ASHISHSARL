
-- Clear old embeddings and alter column to vector(1536)
ALTER TABLE public.products_master
  ALTER COLUMN text_embedding TYPE vector(1536) USING null;
