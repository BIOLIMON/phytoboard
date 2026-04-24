# 🚀 Guía Rápida: Ejecutar SQL en Supabase

## 📍 Ubicación del Script
El archivo SQL ya está listo en: `supabase/schema.sql`

---

## ⚡ 5 Pasos Rápidos

### Paso 1: Abre Supabase Dashboard
```
URL: https://supabase.com/dashboard
```
→ Selecciona tu proyecto

---

### Paso 2: Ve a SQL Editor
En el menú izquierdo:
```
🗂️ SQL Editor
```
→ Haz clic en **"New query"**

---

### Paso 3: Copia el Script SQL

#### Opción A: Copiar desde el archivo
Abre `supabase/schema.sql` en tu editor de código y copia TODO el contenido

#### Opción B: Copiar desde aquí abajo
Ver sección **"SQL Completo"** al final

---

### Paso 4: Pega en Supabase
En el SQL Editor de Supabase, pega el contenido:
```sql
-- [Aquí va todo el contenido de schema.sql]
```

---

### Paso 5: Ejecuta
Presiona:
- **Botón "Run"** en la esquina superior derecha, O
- **Ctrl + Enter** (Windows/Linux)
- **Cmd + Enter** (Mac)

---

## ✅ Verificación

Después de ejecutar, verifica que se crearon las tablas:

### En SQL Editor, ejecuta:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Deberías ver:
```
devices
liceos
readings
```

---

## 🔧 Ejecutar por Partes (Si hay errores)

Si el script completo falla, ejecuta cada sección por separado:

### 1️⃣ Crear tabla LICEOS
```sql
CREATE TABLE IF NOT EXISTS liceos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  region TEXT NOT NULL,
  comuna TEXT NOT NULL,
  latitud NUMERIC NOT NULL,
  longitud NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liceos_nombre ON liceos(nombre);
CREATE INDEX IF NOT EXISTS idx_liceos_region ON liceos(region);
```

### 2️⃣ Crear tabla DEVICES
```sql
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  mac_address TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  ubicacion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_liceo_id ON devices(liceo_id);
CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_activo ON devices(activo);
```

### 3️⃣ Crear tabla READINGS
```sql
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
```

### 4️⃣ Crear funciones
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_liceos_updated_at
  BEFORE UPDATE ON liceos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 5️⃣ Crear vistas (opcional)
```sql
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
```

---

## 📥 Agregar Datos de Prueba

Después de crear las tablas, agrega datos de ejemplo:

```sql
-- Insertar liceos
INSERT INTO liceos (nombre, region, comuna, latitud, longitud) VALUES
  ('Liceo Santiago Central', 'Metropolitana', 'Santiago', -33.4372, -70.6678),
  ('Liceo Valparaíso Orilla del Mar', 'Valparaíso', 'Valparaíso', -33.0472, -71.6127),
  ('Liceo Puerto Montt Sur', 'Región de Los Lagos', 'Puerto Montt', -41.3272, -72.0092);

-- Insertar sensores (nota: primero obtén los IDs de los liceos)
INSERT INTO devices (liceo_id, nombre, mac_address, ubicacion, activo) VALUES
  ((SELECT id FROM liceos WHERE nombre = 'Liceo Santiago Central'), 'Sensor Invernadero A', '00:1A:2B:3C:4D:5E', 'Invernadero A', true),
  ((SELECT id FROM liceos WHERE nombre = 'Liceo Santiago Central'), 'Sensor Invernadero B', '00:1A:2B:3C:4D:5F', 'Invernadero B', true),
  ((SELECT id FROM liceos WHERE nombre = 'Liceo Valparaíso Orilla del Mar'), 'Sensor Huerto 1', '00:1A:2B:3C:4D:60', 'Huerto 1', true);

-- Insertar algunas lecturas de ejemplo
INSERT INTO readings (device_id, timestamp, humedad_suelo, tension_hidrica, temperatura, humedad_aire, nitrogeno, fosforo, potasio)
SELECT 
  d.id,
  NOW() - INTERVAL '1 hour' * generate_series(0, 23),
  45 + random() * 10,
  50 + random() * 30,
  20 + random() * 5,
  60 + random() * 20,
  80 + random() * 40,
  35 + random() * 15,
  150 + random() * 50
FROM devices d
LIMIT 1;  -- Genera datos para el primer sensor
```

---

## 🧪 Verificar Datos Insertados

```sql
-- Ver liceos
SELECT * FROM liceos;

-- Ver dispositivos
SELECT d.id, d.nombre, l.nombre as liceo FROM devices d
JOIN liceos l ON d.liceo_id = l.id;

-- Ver lecturas
SELECT * FROM readings LIMIT 10;

-- Ver última lectura de cada sensor
SELECT * FROM latest_readings;

-- Ver estadísticas
SELECT * FROM sensor_stats_by_liceo;
```

---

## 🛠️ Troubleshooting

### ❌ Error: "Relation "liceos" does not exist"
**Solución**: Ejecuta primero la creación de la tabla `liceos`, antes de las otras.

### ❌ Error: "Foreign key violation"
**Solución**: Verifica que los `liceo_id` existan en la tabla `liceos`.

### ❌ Error: "relation already exists"
**Solución**: Las tablas ya existen (es normal si ejecutas múltiples veces). Usa:
```sql
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS liceos CASCADE;
```

Luego vuelve a ejecutar el script.

### ❌ Tablas creadas pero aplicación no conecta
**Verificar**:
1. Archivo `.env.local` existe en la raíz
2. Contiene: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Reinicia el servidor: `npm run dev`

---

## 📱 Siguiente Paso: Configurar Variables de Entorno

Crea `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...tu-anon-key-aqui
```

**Obtén los valores en Supabase Dashboard**:
```
⚙️ Settings → API → Project URL & Anon key
```

---

## 🎬 Ejecutar Aplicación

```bash
# Instalar dependencias (si no las has instalado)
npm install

# Ejecutar en desarrollo
npm run dev

# Abre en navegador
http://localhost:5173
```

---

## 📊 Verificar en Aplicación

1. Abre http://localhost:5173
2. Ve a **Dashboard**
3. Deberías ver los liceos y sensores que agregaste
4. Los gráficos mostrarán las lecturas en tiempo real

---

## ✨ ¡Listo!

Tu base de datos está configurada y lista para PhytoBoard.

**¿Problemas?** Revisa el archivo `SETUP_DATABASE.md` o `PROJECT_REVIEW.md` para más detalles.
