-- Migration: Drop unused columns from devices
-- Date: 2026-04-22
-- mac_address and descripcion are not used by the dashboard or provisioning flow.

ALTER TABLE devices
  DROP COLUMN IF EXISTS mac_address,
  DROP COLUMN IF EXISTS descripcion;
