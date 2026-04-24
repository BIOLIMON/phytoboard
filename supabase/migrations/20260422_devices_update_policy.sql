-- Migration: Grant UPDATE permission on devices for provisioning
-- Date: 2026-04-22
-- Fix: anon/authenticated role couldn't PATCH devices (missing UPDATE grant + RLS policy)

GRANT UPDATE ON TABLE devices TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'devices'
      AND policyname = 'Allow update all devices'
  ) THEN
    CREATE POLICY "Allow update all devices" ON devices
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END;
$$;
