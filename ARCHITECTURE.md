# 🏗️ Arquitectura de PhytoBoard

## 📐 Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR USUARIO                         │
│  http://localhost:5173 (Desarrollo) o dominio (Producción)      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  APLICACIÓN REACT + TypeScript                   │
│                    (Vite + Tailwind CSS)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │  Dashboard   │  │   Components │          │
│  │     Page     │  │     Page     │  │   (UI Lib)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────┐            │
│  │        HOOKS LAYER (Lógica de Datos)           │            │
│  │                                                │            │
│  │  useReadings()   useDevices()   useLiceos()   │            │
│  │                                                │            │
│  └────────────────────────┼────────────────────────┘            │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────┐            │
│  │    Supabase Client (@supabase/supabase-js)     │            │
│  │           - REST APIs                         │            │
│  │           - Real-time WebSockets              │            │
│  │           - Authentication                     │            │
│  └────────────────────────┼────────────────────────┘            │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │ HTTPS + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend-as-Service)                │
│                      (PostgreSQL + APIs)                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Base de Datos PostgreSQL                   │   │
│  │                                                          │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────────┐        │   │
│  │  │  liceos  │   │ devices  │   │  readings    │        │   │
│  │  │          │   │          │   │              │        │   │
│  │  │ • id     │   │ • id     │   │ • id         │        │   │
│  │  │ • nombre │──>│ • liceo_ │──>│ • device_id  │        │   │
│  │  │ • región │   │   id (FK)│   │ • timestamp  │        │   │
│  │  │ • coords │   │ • nombre │   │ • 7 sensores │        │   │
│  │  │ •created │   │ • mac    │   │ • created    │        │   │
│  │  │  _at     │   │ • activo │   │              │        │   │
│  │  └──────────┘   └──────────┘   └──────────────┘        │   │
│  │                                                          │   │
│  │  Índices: ✅ Optimizados para consultas frecuentes     │   │
│  │  Triggers: ✅ Actualización automática de updated_at   │   │
│  │  Vistas: ✅ latest_readings, sensor_stats_by_liceo    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Supabase Real-time (WebSockets)              │   │
│  │  • Escucha cambios en tabla "readings"                  │   │
│  │  • Push automático a cliente cuando hay INSERT          │   │
│  │  • Actualización en vivo sin polling                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Capas de la Aplicación

### 1️⃣ **Capa de Presentación (UI Components)**
```typescript
// ✅ Reutilizables y sin lógica de negocios

src/components/
├── dashboard/
│   ├── GaugeCard.tsx        // Medidor circular con colores
│   ├── TimeChart.tsx        // Gráfico XY (Recharts)
│   ├── ReadingsTable.tsx    // Tabla de datos en vivo
│   └── DemoBanner.tsx       // Banner informativo
│
├── landing/
│   ├── Hero.tsx             // Sección inicial
│   ├── About.tsx            // Información
│   ├── Pipeline.tsx         // Flujo del sistema
│   ├── SensorGrid.tsx       // Grid de sensores
│   ├── Institutions.tsx     // Instituciones participantes
│   └── LiceoCard.tsx        // Tarjeta de institución
│
├── layout/
│   ├── Sidebar.tsx          // Navegación lateral
│   ├── Topbar.tsx           // Barra superior
│   └── Footer.tsx           // Pie de página
│
├── modals/
│   ├── LoginModal.tsx       // Formulario de login
│   └── ConfigModal.tsx      // Configuración
│
└── ui/
    ├── Button.tsx           // Botón genérico
    ├── Modal.tsx            // Contenedor modal
    └── StatusPill.tsx       // Badge de estado
```

### 2️⃣ **Capa de Lógica (Hooks Personalizados)**
```typescript
// ✅ Manejo de datos y estado

src/hooks/
├── useReadings()     // Obtener y escuchar lecturas
│   └── Real-time con WebSockets
├── useDevices()      // Obtener sensores por liceo
│   └── Con filtro opcional
└── useLiceos()       // Obtener instituciones
    └── Ordenadas por nombre
```

### 3️⃣ **Capa de Datos (Supabase Client)**
```typescript
// ✅ Conexión a base de datos

src/lib/supabase.ts
├── Inicialización del cliente
├── Configuración de credenciales
└── Punto central para todas las queries
```

### 4️⃣ **Capa de Tipos (TypeScript)**
```typescript
// ✅ Tipado fuerte

src/types/index.ts
├── Liceo interface
├── Device interface
├── Reading interface
├── SensorMeta interface
└── SENSORS array (metadata)
```

---

## 🔄 Flujo de Datos

### Caso 1: Cargar Dashboard
```
1. Usuario entra a /dashboard
                 ↓
2. Componente Dashboard.tsx renderiza
                 ↓
3. useReadings() se ejecuta:
   a) Obtiene últimas 24h de lecturas
   b) Se suscribe a cambios en tiempo real
                 ↓
4. Componentes hijos reciben props:
   - GaugeCard: Muestra valor actual
   - TimeChart: Gráfica histórico
   - ReadingsTable: Tabla de datos
                 ↓
5. Si llegan nuevos datos (WebSocket):
   a) Estado se actualiza
   b) Componentes re-renderean
   c) Usuario ve datos frescos
```

### Caso 2: Agregar Nueva Lectura (IoT Sensor)
```
1. Sensor físico envía datos a Supabase
                 ↓
2. INSERT en tabla "readings"
                 ↓
3. Trigger SQL: update_updated_at()
                 ↓
4. Supabase emite WebSocket event
                 ↓
5. Cliente recibe notificación
                 ↓
6. Hook useReadings() actualiza estado
                 ↓
7. UI re-renderea automáticamente
                 ↓
8. Usuario ve datos en tiempo real
```

---

## 📊 Modelo de Datos (ER Diagram)

```
┌─────────────────┐
│     LICEOS      │
├─────────────────┤
│ id (PK)         │
│ nombre          │
│ region          │
│ comuna          │
│ latitud         │
│ longitud        │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1
         │
         │ N
         │
┌────────▼──────────────┐
│     DEVICES          │
├──────────────────────┤
│ id (PK)              │
│ liceo_id (FK) ───────┼─> LICEOS.id
│ nombre               │
│ mac_address (UNIQUE) │
│ descripcion          │
│ ubicacion            │
│ activo               │
│ created_at           │
│ updated_at           │
└────────┬─────────────┘
         │ 1
         │
         │ N
         │
┌────────▼──────────────┐
│      READINGS         │
├──────────────────────┤
│ id (PK)              │
│ device_id (FK) ──────┼─> DEVICES.id
│ timestamp            │
│ humedad_suelo        │
│ tension_hidrica      │
│ temperatura          │
│ humedad_aire         │
│ nitrogeno            │
│ fosforo              │
│ potasio              │
│ created_at           │
└──────────────────────┘
```

**Relaciones**:
- `1:N` Liceo → Devices (Un liceo tiene múltiples sensores)
- `1:N` Device → Readings (Un sensor tiene múltiples lecturas)

---

## 🔌 Puntos de Integración

### ✅ Base de Datos
```typescript
// En los hooks, ejemplo:
const { data } = await supabase
  .from('readings')
  .select('*')
  .eq('device_id', deviceId)
  .gte('timestamp', desde)
  .order('timestamp', { ascending: true })
```

### ✅ Real-time
```typescript
// En useReadings:
const channel = supabase
  .channel(`readings-rt-${deviceId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'readings' },
    ({ new: r }) => { /* actualizar estado */ }
  )
  .subscribe()
```

### ✅ Autenticación (Futura)
```typescript
// Usar Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: user,
  password: pass
})
```

---

## 🚀 Stack Tecnológico Completo

```
Frontend
├── React 19              → Framework UI
├── TypeScript 5          → Type-safety
├── Vite 6                → Build rápido
├── React Router 7        → Enrutamiento
├── Tailwind CSS 3        → Estilos
├── Recharts 3            → Gráficos
├── date-fns 4            → Manejo de fechas
└── Space Grotesk/Mono    → Tipografía

Backend
├── Supabase              → Backend-as-Service
├── PostgreSQL 15         → Base de datos
├── PostgREST             → REST API auto
└── Realtime              → WebSockets

DevOps / Build
├── Node.js               → Runtime JS
├── npm                   → Package manager
├── ESLint 9              → Code quality
├── PostCSS               → Procesamiento CSS
└── Autoprefixer          → Compatibilidad CSS
```

---

## 📈 Flujo de Desarrollo

```
Desarrollo
    ↓
npm run dev (Vite devserver en :5173)
    ↓
Hot Module Reload (HMR) en cambios
    ↓
Compilación TypeScript en tiempo real
    ↓
Conexión a Supabase (API REST + WebSocket)
    ↓
Ver cambios instantáneos
    ↓
    
Build
    ↓
npm run build (Vite build)
    ↓
Type checking (tsc -b)
    ↓
Optimización y bundling
    ↓
Output: dist/
    ↓
    
Deployment
    ↓
Copiar dist/ a servidor
    ↓
Servir con HTTP server (nginx, Vercel, etc)
    ↓
Conecta a Supabase en producción
    ↓
¡Listo!
```

---

## 🔐 Seguridad por Capas

```
┌─────────────────────────────────┐
│  Navegador (Cliente)            │
│  - Variables de entorno públicas│
│  - Anon key (no sensible)       │
└────────────┬────────────────────┘
             │ HTTPS/WSS
             ▼
┌─────────────────────────────────┐
│  Supabase                       │
│  - RLS (Row Level Security)     │
│  - Validación de datos          │
│  - Autenticación                │
└─────────────────────────────────┘
```

---

## ✨ Características Especiales

### Real-time
✅ Los datos se actualizan automáticamente sin polling

### Type-Safe
✅ TypeScript evita errores en tiempo de compilación

### Responsive
✅ Funciona en desktop, tablet y móvil

### Escalable
✅ Arquitectura preparada para crecimiento

### Mantenible
✅ Código limpio y bien organizado

---

## 🎯 Próximos Pasos de Desarrollo

```
Fase 1: MVP (Ya están hechos)
├── ✅ Estructura base
├── ✅ Componentes UI
├── ✅ Conectividad Supabase
└── ✅ Real-time

Fase 2: Autenticación (Por hacer)
├── Login con Supabase Auth
├── Protección de rutas
├── Control de acceso
└── Gestión de usuarios

Fase 3: Robustez (Por hacer)
├── Error boundaries
├── Manejo de errores
├── Validación de datos
├── Tests unitarios
└── Tests E2E

Fase 4: Features (Por hacer)
├── Exportar datos
├── Alertas
├── Notificaciones push
├── Predictive analytics
└── Mobile app
```

---

## 📞 Puntos de Contacto

**Cliente REST API**: `supabase.from('tabla').select(...)`
**Real-time**: `supabase.channel('nombre').on(...).subscribe()`
**Auth**: `supabase.auth.signInWithPassword(...)`

---

## 🎓 Conclusión

PhytoBoard tiene una arquitectura robusta, escalable y moderna que:
- Separa correctamente responsabilidades
- Usa tecnologías actualizadas
- Es fácil de mantener y extender
- Está lista para crecer

**¡Está listo para producción con los siguientes pasos completados!**
