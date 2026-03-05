
-- Alter sales_audit_log to match the user's desired schema
-- Add action_type column (create, edit, cancel)
ALTER TABLE public.sales_audit_log 
  ADD COLUMN IF NOT EXISTS action_type text NOT NULL DEFAULT 'create';

-- Rename snapshot to previous_sale_snapshot
ALTER TABLE public.sales_audit_log 
  RENAME COLUMN snapshot TO previous_sale_snapshot;

-- Add new_sale_snapshot column
ALTER TABLE public.sales_audit_log 
  ADD COLUMN IF NOT EXISTS new_sale_snapshot jsonb;

-- Add reason column
ALTER TABLE public.sales_audit_log 
  ADD COLUMN IF NOT EXISTS reason text;

-- Rename performed_by to edited_by
ALTER TABLE public.sales_audit_log 
  RENAME COLUMN performed_by TO edited_by;

-- Rename created_at to edited_at
ALTER TABLE public.sales_audit_log 
  RENAME COLUMN created_at TO edited_at;

-- Migrate existing data: copy 'action' values to 'action_type'
UPDATE public.sales_audit_log SET action_type = action WHERE action IS NOT NULL;

-- Drop old action column
ALTER TABLE public.sales_audit_log DROP COLUMN IF EXISTS action;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_sales_audit_log_action_type ON public.sales_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_sales_audit_log_edited_at ON public.sales_audit_log(edited_at);
