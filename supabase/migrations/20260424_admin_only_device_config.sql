-- Migration: Device configuration access control
-- Date: 2026-04-24
--
-- Rules:
--   - Anyone (anon) can configure a device that has not been activated yet (activo = false).
--   - Once a device is activated (activo = true), only authenticated admins can update it.
--   - This mirrors the UI: Config button is visible to all on inactive devices,
--     and only to admins on active (already configured) devices.

-- 1. Drop the previous permissive policy (allows everyone to update any device)
DROP POLICY IF EXISTS "Allow update all devices" ON devices;

-- 2. Policy for unauthenticated users: can only update inactive devices
--    (initial configuration before activation)
CREATE POLICY "Anon can configure inactive devices" ON devices
  FOR UPDATE
  TO anon
  USING (activo = false)
  WITH CHECK (true);

-- 3. Policy for authenticated (admin) users: can update any device
--    (reconfiguration of already-active devices)
CREATE POLICY "Admin can update any device" ON devices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
