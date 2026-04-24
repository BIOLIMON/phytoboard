-- PhytoBoard Database Schema
-- Esquema y seed para Supabase

-- ============================================================================
-- TABLA: liceos
-- ============================================================================

CREATE TABLE IF NOT EXISTS liceos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  region TEXT NOT NULL,
  comuna TEXT NOT NULL,
  latitud NUMERIC NOT NULL,
  longitud NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE liceos
  ADD COLUMN IF NOT EXISTS codigo TEXT;

WITH duplicados_liceos AS (
  SELECT ctid,
         ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY created_at NULLS LAST, id) AS rn
  FROM liceos
  WHERE codigo IS NOT NULL
)
DELETE FROM liceos
WHERE ctid IN (
  SELECT ctid
  FROM duplicados_liceos
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_liceos_codigo_unique ON liceos(codigo);
CREATE INDEX IF NOT EXISTS idx_liceos_nombre ON liceos(nombre);
CREATE INDEX IF NOT EXISTS idx_liceos_region ON liceos(region);

-- ============================================================================
-- TABLA: devices
-- ============================================================================

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  mac_address TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  ubicacion TEXT,
  activo BOOLEAN DEFAULT true,
  sensores_habilitados JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_configuracion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS codigo TEXT;

WITH duplicados_devices AS (
  SELECT ctid,
         ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY created_at NULLS LAST, id) AS rn
  FROM devices
  WHERE codigo IS NOT NULL
)
DELETE FROM devices
WHERE ctid IN (
  SELECT ctid
  FROM duplicados_devices
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_codigo_unique ON devices(codigo);
CREATE INDEX IF NOT EXISTS idx_devices_liceo_id ON devices(liceo_id);
CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_activo ON devices(activo);

-- ============================================================================
-- TABLA: readings
-- ============================================================================

CREATE TABLE IF NOT EXISTS readings (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  humedad_suelo NUMERIC,
  tension_hidrica NUMERIC,
  temperatura NUMERIC,
  humedad_aire NUMERIC,
  nitrogeno NUMERIC,
  fosforo NUMERIC,
  potasio NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_device_id ON readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp ON readings(device_id, timestamp DESC);

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_device_codigo_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
    RAISE EXCEPTION 'codigo de dispositivo es inmutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_reading_by_device_code(
  p_device_code TEXT,
  p_timestamp TIMESTAMPTZ DEFAULT NOW(),
  p_humedad_suelo NUMERIC DEFAULT NULL,
  p_tension_hidrica NUMERIC DEFAULT NULL,
  p_temperatura NUMERIC DEFAULT NULL,
  p_humedad_aire NUMERIC DEFAULT NULL,
  p_nitrogeno NUMERIC DEFAULT NULL,
  p_fosforo NUMERIC DEFAULT NULL,
  p_potasio NUMERIC DEFAULT NULL
)
RETURNS readings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_id UUID;
  v_reading readings;
BEGIN
  SELECT id
    INTO v_device_id
  FROM devices
  WHERE codigo = p_device_code
    AND activo = true;

  IF v_device_id IS NULL THEN
    RAISE EXCEPTION 'Device code not found or inactive: %', p_device_code;
  END IF;

  INSERT INTO readings (
    device_id,
    timestamp,
    humedad_suelo,
    tension_hidrica,
    temperatura,
    humedad_aire,
    nitrogeno,
    fosforo,
    potasio
  )
  VALUES (
    v_device_id,
    p_timestamp,
    p_humedad_suelo,
    p_tension_hidrica,
    p_temperatura,
    p_humedad_aire,
    p_nitrogeno,
    p_fosforo,
    p_potasio
  )
  RETURNING * INTO v_reading;

  RETURN v_reading;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_reading_by_device_code(
  TEXT,
  TIMESTAMPTZ,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC
) TO anon, authenticated;

DROP TRIGGER IF EXISTS trigger_liceos_updated_at ON liceos;
CREATE TRIGGER trigger_liceos_updated_at
  BEFORE UPDATE ON liceos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_devices_updated_at ON devices;
CREATE TRIGGER trigger_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_devices_codigo_immutable ON devices;
CREATE TRIGGER trigger_devices_codigo_immutable
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_device_codigo_update();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE liceos TO anon, authenticated;
GRANT SELECT ON TABLE devices TO anon, authenticated;
GRANT SELECT ON TABLE readings TO anon, authenticated;

ALTER TABLE liceos ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'liceos' AND policyname = 'Allow read all liceos'
  ) THEN
    CREATE POLICY "Allow read all liceos" ON liceos
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devices' AND policyname = 'Allow read all devices'
  ) THEN
    CREATE POLICY "Allow read all devices" ON devices
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'readings' AND policyname = 'Allow read all readings'
  ) THEN
    CREATE POLICY "Allow read all readings" ON readings
      FOR SELECT USING (true);
  END IF;
END;
$$;

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Seed de demo desactivado por defecto.
-- Para activarlo de forma explícita en una sesión SQL:
--   SELECT set_config('app.seed_demo', 'on', false);
DO $$
BEGIN
IF COALESCE(current_setting('app.seed_demo', true), 'off') = 'on' THEN

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

INSERT INTO devices (liceo_id, codigo, nombre, mac_address, ubicacion, activo)
VALUES
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_1', 'Grupo Menesiano 1', '24:6F:28:10:00:01', 'Invernadero 1', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_2', 'Grupo Menesiano 2', '24:6F:28:10:00:02', 'Invernadero 2', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_3', 'Grupo Menesiano 3', '24:6F:28:10:00:03', 'Invernadero 3', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_4', 'Grupo Menesiano 4', '24:6F:28:10:00:04', 'Invernadero 4', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_5', 'Grupo Menesiano 5', '24:6F:28:10:00:05', 'Invernadero 5', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_6', 'Grupo Menesiano 6', '24:6F:28:10:00:06', 'Invernadero 6', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_7', 'Grupo Menesiano 7', '24:6F:28:10:00:07', 'Invernadero 7', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_8', 'Grupo Menesiano 8', '24:6F:28:10:00:08', 'Invernadero 8', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_9', 'Grupo Menesiano 9', '24:6F:28:10:00:09', 'Invernadero 9', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_10', 'Grupo Menesiano 10', '24:6F:28:10:00:0A', 'Invernadero 10', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_11', 'Grupo Menesiano 11', '24:6F:28:10:00:0B', 'Invernadero 11', true),
  ((SELECT id FROM liceos WHERE codigo = 'menesianos'), 'grupo_menesiano_12', 'Grupo Menesiano 12', '24:6F:28:10:00:0C', 'Invernadero 12', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_1', 'Grupo Carmen 1', '24:6F:28:20:00:01', 'Parcela 1', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_2', 'Grupo Carmen 2', '24:6F:28:20:00:02', 'Parcela 2', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_3', 'Grupo Carmen 3', '24:6F:28:20:00:03', 'Parcela 3', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_4', 'Grupo Carmen 4', '24:6F:28:20:00:04', 'Parcela 4', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_5', 'Grupo Carmen 5', '24:6F:28:20:00:05', 'Parcela 5', true),
  ((SELECT id FROM liceos WHERE codigo = 'carmen'), 'grupo_carmen_6', 'Grupo Carmen 6', '24:6F:28:20:00:06', 'Parcela 6', true)
ON CONFLICT (codigo) DO UPDATE SET
  liceo_id = EXCLUDED.liceo_id,
  nombre = EXCLUDED.nombre,
  mac_address = EXCLUDED.mac_address,
  ubicacion = EXCLUDED.ubicacion,
  activo = EXCLUDED.activo,
  updated_at = NOW();

INSERT INTO readings (
  device_id,
  timestamp,
  humedad_suelo,
  tension_hidrica,
  temperatura,
  humedad_aire,
  nitrogeno,
  fosforo,
  potasio
)
SELECT
  d.id,
  NOW() - (series.n * INTERVAL '2 hours'),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 52 ELSE 61 END + (random() * 8 - 4))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 44 ELSE 36 END + (random() * 10 - 5))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 22 ELSE 24 END + (random() * 4 - 2))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 58 ELSE 63 END + (random() * 10 - 5))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 88 ELSE 96 END + (random() * 16 - 8))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 38 ELSE 42 END + (random() * 8 - 4))::numeric, 1),
  ROUND((CASE WHEN l.codigo = 'menesianos' THEN 172 ELSE 185 END + (random() * 24 - 12))::numeric, 1)
FROM devices d
JOIN liceos l ON l.id = d.liceo_id
CROSS JOIN generate_series(0, 2) AS series(n)
WHERE NOT EXISTS (
  SELECT 1 FROM readings r
  WHERE r.device_id = d.id
);

END IF;
END;
$$;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

CREATE OR REPLACE VIEW latest_readings AS
SELECT DISTINCT ON (device_id)
  device_id,
  timestamp,
  humedad_suelo,
  tension_hidrica,
  temperatura,
  humedad_aire,
  nitrogeno,
  fosforo,
  potasio
FROM readings
ORDER BY device_id, timestamp DESC;

CREATE OR REPLACE VIEW sensor_stats_by_liceo AS
SELECT
  d.liceo_id,
  l.nombre as liceo_nombre,
  d.id as device_id,
  d.nombre as device_nombre,
  COUNT(r.id) as total_readings,
  MAX(r.timestamp) as last_reading,
  AVG(r.temperatura) as avg_temperatura,
  AVG(r.humedad_suelo) as avg_humedad_suelo,
  AVG(r.humedad_aire) as avg_humedad_aire
FROM devices d
LEFT JOIN liceos l ON d.liceo_id = l.id
LEFT JOIN readings r ON d.id = r.device_id
GROUP BY d.liceo_id, d.id, l.nombre, d.nombre;
