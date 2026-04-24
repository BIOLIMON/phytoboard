# PhytoBoard - Guía de Configuración de Base de Datos

## 📋 Resumen del Proyecto

PhytoBoard es un dashboard de telemetría agrícola que monitorea sensores IoT instalados en instituciones educativas (liceos). El proyecto está desarrollado con:

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Recharts para gráficos
- **Backend**: Supabase (PostgreSQL + APIs REST)
- **Características**: Real-time con WebSockets, gráficos interactivos, historial de lecturas

---

## 🗄️ Estructura de la Base de Datos

### Tabla: **liceos**
Instituciones educativas donde se instalan los sensores.

```sql
id (UUID)              -- Identificador único
nombre (TEXT)          -- Nombre del liceo
region (TEXT)          -- Región geográfica
comuna (TEXT)          -- Comuna
latitud (NUMERIC)      -- Coordenada de latitud
longitud (NUMERIC)     -- Coordenada de longitud
created_at (TIMESTAMP) -- Fecha de creación
updated_at (TIMESTAMP) -- Última actualización
```

### Tabla: **devices**
Sensores IoT instalados en los liceos.

```sql
id (UUID)          -- Identificador único
liceo_id (UUID)    -- FK → liceos.id
nombre (TEXT)      -- Nombre del dispositivo
mac_address (TEXT) -- Dirección MAC (única)
descripcion (TEXT) -- Descripción opcional
ubicacion (TEXT)   -- Ubicación dentro del liceo
activo (BOOLEAN)   -- Estado del dispositivo
created_at (TIMESTAMP) -- Fecha de creación
updated_at (TIMESTAMP) -- Última actualización
```

### Tabla: **readings**
Lecturas de datos de los sensores (telemetría).

```sql
id (BIGSERIAL)           -- Identificador único
device_id (UUID)         -- FK → devices.id
timestamp (TIMESTAMP)    -- Fecha y hora de la lectura
humedad_suelo (NUMERIC)  -- % de humedad en el suelo
tension_hidrica (NUMERIC)-- Tensión hídrica (kPa)
temperatura (NUMERIC)    -- Temperatura (°C)
humedad_aire (NUMERIC)   -- % de humedad en el aire
nitrogeno (NUMERIC)      -- mg/kg
fosforo (NUMERIC)        -- mg/kg
potasio (NUMERIC)        -- mg/kg
created_at (TIMESTAMP)   -- Fecha de creación
```

---

## 🚀 Pasos para Configurar la Base de Datos

### 1️⃣ Accede a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú izquierdo)

### 2️⃣ Ejecutar el Script SQL

1. Abre el archivo `supabase/schema.sql` en este repositorio
2. Copia todo el contenido
3. En el SQL Editor de Supabase, crea una nueva query
4. Pega el contenido completo
5. Haz clic en **Run** (o presiona Ctrl+Enter)

Alternativamente, puedes copiar y ejecutar las secciones una por una:

#### Opción A: Ejecutar todo de una vez
```sql
-- Copia todo el contenido de schema.sql y ejecuta
```

#### Opción B: Ejecutar por partes
```sql
-- Primero: Crear tabla liceos
-- (copiar solo la sección de liceos)

-- Segundo: Crear tabla devices
-- (copiar solo la sección de devices)

-- Tercero: Crear tabla readings
-- (copiar solo la sección de readings)

-- Cuarto: Funciones y triggers
-- (copiar la sección de funciones)

-- Quinto: Vistas útiles
-- (copiar la sección de vistas)
```

### 3️⃣ Agregar Datos de Prueba (Opcional)

Descomenta la sección de **DATOS DE EJEMPLO** en el archivo `schema.sql` y ejecuta:

```sql
INSERT INTO liceos (nombre, region, comuna, latitud, longitud) VALUES
  ('Liceo A', 'Metropolitana', 'Santiago', -33.4372, -70.6678),
  ('Liceo B', 'Valparaíso', 'Valparaíso', -33.0472, -71.6127),
  ('Liceo C', 'Región de Los Lagos', 'Puerto Montt', -41.3272, -72.0092);
```

### 4️⃣ Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtén estas credenciales en:
- **Settings** → **API** en el dashboard de Supabase
- Copia la URL del proyecto y la anon key

### 5️⃣ Instalar Dependencias y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm build
```

---

## 📊 Vistas Disponibles

### `latest_readings`
Obtiene la última lectura de cada dispositivo:

```sql
SELECT * FROM latest_readings;
```

### `sensor_stats_by_liceo`
Estadísticas agregadas por liceo:

```sql
SELECT * FROM sensor_stats_by_liceo;
```

---

## 🔒 Row Level Security (RLS) - Opcional

Si deseas implementar seguridad a nivel de fila:

```sql
-- Habilitar RLS
ALTER TABLE liceos ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Crear políticas (ejemplo: permitir lectura a todos)
CREATE POLICY "Allow read all liceos" ON liceos
  FOR SELECT USING (true);

CREATE POLICY "Allow read all devices" ON devices
  FOR SELECT USING (true);

CREATE POLICY "Allow read all readings" ON readings
  FOR SELECT USING (true);
```

---

## 🔌 Verificar la Conexión

Una vez creadas las tablas, verifica que el cliente se conecta correctamente:

```typescript
// En la aplicación
import { supabase } from './src/lib/supabase'

async function testConnection() {
  const { data, error } = await supabase.from('liceos').select('*')
  console.log(data, error)
}
```

---

## ⚙️ Índices Creados

Para optimizar las consultas, se crean estos índices automáticamente:

| Tabla | Índice | Propósito |
|-------|--------|----------|
| liceos | idx_liceos_nombre | Búsquedas por nombre |
| liceos | idx_liceos_region | Filtrado por región |
| devices | idx_devices_liceo_id | Relación con liceo |
| devices | idx_devices_mac_address | Identificación única |
| devices | idx_devices_activo | Filtro de dispositivos activos |
| readings | idx_readings_device_id | Búsqueda por dispositivo |
| readings | idx_readings_timestamp | Consultas de tiempo |
| readings | idx_readings_device_timestamp | Combinación de ambas |

---

## 📝 Campos de Sensores

Los valores de sensor soportados en la tabla `readings`:

| Campo | Unidad | Rango Óptimo | Descripción |
|-------|--------|--------------|-------------|
| humedad_suelo | % | 40-70% | Humedad del suelo |
| tension_hidrica | kPa | 0-80 | Tensión hídrica |
| temperatura | °C | 15-35 | Temperatura ambiental |
| humedad_aire | % | 40-80 | Humedad relativa |
| nitrogeno | mg/kg | 60-140 | Concentración de N |
| fosforo | mg/kg | 20-60 | Concentración de P |
| potasio | mg/kg | 100-250 | Concentración de K |

---

## 🐛 Solución de Problemas

### Error: "Table already exists"
Las tablas ya existen. Usa `DROP TABLE IF EXISTS` si necesitas recrearlas.

### Error: "Foreign key violation"
Asegúrate de que los `id` en las referencias existan en las tablas principales.

### La aplicación no se conecta
Verifica que:
1. Las variables de entorno estén configuradas correctamente
2. El archivo `.env.local` exista
3. La URL y la anon key sean correctas

### Real-time no funciona
En Supabase Dashboard → **Settings** → **Realtime**, verifica que la tabla `readings` esté habilitada.

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)

---

## ✅ Checklist de Configuración

- [ ] Script SQL ejecutado en Supabase
- [ ] Tablas creadas (verifica en SQL Editor)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Aplicación ejecutándose (`npm run dev`)
- [ ] Datos de prueba agregados (opcional)
- [ ] Conexión verificada en el navegador
- [ ] Datos mostrándose en el dashboard

---

**¡Listo! Tu base de datos de PhytoBoard está configurada y lista para usar.**
