-- Migration: Add device provisioning fields and create inactive holders
-- Date: 2026-04-22
-- Safe to run multiple times.

BEGIN;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS sensores_habilitados JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS prompt_configuracion TEXT;

CREATE OR REPLACE FUNCTION prevent_device_codigo_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
    RAISE EXCEPTION 'codigo de dispositivo es inmutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE devices
SET sensores_habilitados = COALESCE(sensores_habilitados, '[]'::jsonb)
WHERE sensores_habilitados IS NULL;

DELETE FROM readings r
USING devices d
WHERE r.device_id = d.id
  AND (
    d.codigo LIKE 'grupo_menesiano_%'
    OR d.codigo LIKE 'grupo_carmen_%'
    OR d.nombre LIKE 'Grupo Menesiano %'
    OR d.nombre LIKE 'Grupo Carmen %'
  );

DELETE FROM devices
WHERE codigo LIKE 'grupo_menesiano_%'
   OR codigo LIKE 'grupo_carmen_%'
   OR nombre LIKE 'Grupo Menesiano %'
   OR nombre LIKE 'Grupo Carmen %';

INSERT INTO liceos (codigo, nombre, region, comuna, latitud, longitud)
VALUES
  ('menesianos', 'Liceo Menesianos', 'Región Metropolitana', 'Melipilla', -33.6878, -71.2168),
  ('carmen', 'Liceo El Carmen', 'O''Higgins', 'San Fernando', -34.5840, -70.9900)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  region = EXCLUDED.region,
  comuna = EXCLUDED.comuna,
  latitud = EXCLUDED.latitud,
  longitud = EXCLUDED.longitud,
  updated_at = NOW();

INSERT INTO devices (liceo_id, codigo, nombre, mac_address, ubicacion, activo, sensores_habilitados)
VALUES
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_1', 'Grupo Menesiano 1', '02:00:00:10:00:01', 'Invernadero 1', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_2', 'Grupo Menesiano 2', '02:00:00:10:00:02', 'Invernadero 2', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_3', 'Grupo Menesiano 3', '02:00:00:10:00:03', 'Invernadero 3', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_4', 'Grupo Menesiano 4', '02:00:00:10:00:04', 'Invernadero 4', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_5', 'Grupo Menesiano 5', '02:00:00:10:00:05', 'Invernadero 5', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_6', 'Grupo Menesiano 6', '02:00:00:10:00:06', 'Invernadero 6', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_7', 'Grupo Menesiano 7', '02:00:00:10:00:07', 'Invernadero 7', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_8', 'Grupo Menesiano 8', '02:00:00:10:00:08', 'Invernadero 8', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_9', 'Grupo Menesiano 9', '02:00:00:10:00:09', 'Invernadero 9', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_10', 'Grupo Menesiano 10', '02:00:00:10:00:0A', 'Invernadero 10', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_11', 'Grupo Menesiano 11', '02:00:00:10:00:0B', 'Invernadero 11', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_12', 'Grupo Menesiano 12', '02:00:00:10:00:0C', 'Invernadero 12', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_1', 'Grupo Carmen 1', '02:00:00:20:00:01', 'Parcela 1', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_2', 'Grupo Carmen 2', '02:00:00:20:00:02', 'Parcela 2', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_3', 'Grupo Carmen 3', '02:00:00:20:00:03', 'Parcela 3', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_4', 'Grupo Carmen 4', '02:00:00:20:00:04', 'Parcela 4', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_5', 'Grupo Carmen 5', '02:00:00:20:00:05', 'Parcela 5', false, '[]'::jsonb),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_6', 'Grupo Carmen 6', '02:00:00:20:00:06', 'Parcela 6', false, '[]'::jsonb)
ON CONFLICT (codigo) DO UPDATE SET
  liceo_id = EXCLUDED.liceo_id,
  nombre = EXCLUDED.nombre,
  mac_address = EXCLUDED.mac_address,
  ubicacion = EXCLUDED.ubicacion,
  activo = EXCLUDED.activo,
  sensores_habilitados = EXCLUDED.sensores_habilitados,
  updated_at = NOW();

DROP TRIGGER IF EXISTS trigger_devices_codigo_immutable ON devices;
CREATE TRIGGER trigger_devices_codigo_immutable
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_device_codigo_update();

COMMIT;