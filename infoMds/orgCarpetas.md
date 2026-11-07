koi-nexus-core/
├── app/                          <-- TUS PANTALLAS Y MÓDULOS
│   ├── inventario/               <-- Módulo 1: Bodega y Trazabilidad
│   │   ├── _components/          <-- Tablas y modales solo de inventario
│   │   ├── _actions/             <-- Server Actions (Drizzle + JSONB Audit)
│   │   └── page.tsx
│   ├── seguridad/                <-- Módulo 2: Guardia Redis y Colas
│   │   ├── _components/          <-- Gráficos de bloqueos y API Keys
│   │   ├── _actions/             <-- Server Actions para disparar auditorías
│   │   └── page.tsx
│   └── api/                      <-- Endpoints externos (para probar con Postman)
│       └── v1/stock/route.ts
├── components/
│   └── ui/                       <-- Tus piezas de shadcn (button, table, card...)
├── db/                           <-- ¡AQUÍ AFUERA! Tu base de datos Drizzle
│   ├── schema.ts                 <-- Las 4 tablas
│   ├── index.ts                  <-- La conexión a PostgreSQL
│   └── seed.ts                   <-- Los datos de prueba iniciales
├── lib/                          <-- Ya existe afuera (utilidades globales)
│   ├── utils.ts                  <-- Creado por shadcn
│   ├── redis.ts                  <-- Conexión al Guardia Redis
│   └── rate-limiter.ts           <-- Lógica de bloqueo por minuto
├── .env                          <-- Tus contraseñas
├── docker-compose.yml            <-- Contenedor de Redis
└── drizzle.config.ts             <-- Configuración de Drizzle