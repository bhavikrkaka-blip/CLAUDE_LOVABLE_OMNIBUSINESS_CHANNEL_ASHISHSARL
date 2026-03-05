
-- Step 1: Add new roles to app_role enum (must be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pos_operator';
