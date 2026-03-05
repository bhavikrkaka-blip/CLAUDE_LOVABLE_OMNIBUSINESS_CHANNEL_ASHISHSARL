-- Add analytics/tracking columns to system_settings
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS fb_pixel_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fb_pixel_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ga4_measurement_id TEXT DEFAULT '';
