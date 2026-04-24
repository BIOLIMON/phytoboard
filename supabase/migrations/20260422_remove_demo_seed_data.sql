-- Migration: Remove demo/seed data from PhytoBoard tables
-- Date: 2026-04-22
-- Safe to run multiple times.

BEGIN;

-- 1) Remove readings tied to demo devices.
DELETE FROM readings r
USING devices d
WHERE r.device_id = d.id
  AND (
    d.codigo LIKE 'grupo_menesiano_%'
    OR d.codigo LIKE 'grupo_carmen_%'
    OR d.nombre LIKE 'Grupo Menesiano %'
    OR d.nombre LIKE 'Grupo Carmen %'
  );

-- 2) Remove demo devices.
DELETE FROM devices
WHERE codigo LIKE 'grupo_menesiano_%'
   OR codigo LIKE 'grupo_carmen_%'
   OR nombre LIKE 'Grupo Menesiano %'
   OR nombre LIKE 'Grupo Carmen %';

-- 3) Remove demo liceos only when they no longer have devices.
DELETE FROM liceos l
WHERE l.codigo IN ('menesianos', 'carmen')
  AND NOT EXISTS (
    SELECT 1
    FROM devices d
    WHERE d.liceo_id = l.id
  );

COMMIT;
