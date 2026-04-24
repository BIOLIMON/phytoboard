-- Migration: Allow authenticated admins to delete readings
-- Date: 2026-04-24
-- Needed for the device reset feature: when an admin resets a device,
-- all its historical readings are wiped along with the configuration.

GRANT DELETE ON TABLE readings TO authenticated;

CREATE POLICY "Admin can delete readings" ON readings
  FOR DELETE
  TO authenticated
  USING (true);
