# 🛡️ Koi Nexus Core — Enterprise B2B Logistics & API Security Engine

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Plataforma de trazabilidad logística mayorista (B2B), auditoría forense inmutable y protección de tráfico distribuida. Diseñada bajo principios de arquitectura modular, procesamiento asíncrono mediante colas y prácticas **DevSecOps**.

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    Client[Tienda B2B / API Client] -->|HTTP GET /api/v1/stock| Gateway[Next.js 16 Route Handler]
    Operator[Operador Logístico] -->|Server Actions| UI[Dashboard Shadcn/UI]
    
    Gateway -->|1. Verifica Límite < 5ms| Redis[(Redis 7: Rate Limiter)]
    Redis -->|429 Bloqueado| Incident[Alerta Crítica en PostgreSQL]
    Redis -->|200 Permitido| DB[(PostgreSQL 16 + Drizzle ORM)]
    
    UI -->|Ajuste de Stock| Audit[Cámara de Auditoría JSONB]
    Audit --> DB
    
    UI -->|Dispara Escaneo| BullMQ[[Redis BullMQ Queue]]
    BullMQ -->|Procesamiento Asíncrono| Worker[Background Security Worker]
    Worker -->|Actualiza Reporte| DB
```

---

## 🚀 Características de Ingeniería

1. **Rate Limiting Distribuido en Memoria (`Redis`):** Protección en tiempo real contra *scraping* y ataques de fuerza bruta por cliente B2B usando contadores atómicos (`INCR` + `TTL`) con tiempo de respuesta `< 5ms` antes de impactar PostgreSQL.
2. **Cámara de Auditoría Forense Inmutable (`JSONB`):** Cada modificación de inventario registra instantáneas completas del estado previo (`previous_data`) y posterior (`new_data`), junto con el operador y dirección IP para auditorías de merma.
3. **Procesamiento Asíncrono con Colas (`BullMQ`):** Desacoplamiento de escaneos pesados de seguridad e integridad de stock mediante *Background Workers* sobre Redis sin bloquear el hilo principal de la aplicación.
4. **Pipeline CI/CD & DevSecOps (`GitHub Actions`):** Verificación automatizada de tipado estricto en TypeScript y escaneo de vulnerabilidades en dependencias del sistema con **Aqua Security Trivy** en cada *push*.

---

## 🛠️ Tecnologías Utilizadas (Tech Stack)

| Capa | Tecnología | Propósito en la Arquitectura |
| :--- | :--- | :--- |
| **Core & Full-Stack** | **Next.js 16 (App Router)**, React 19, TypeScript | Server Actions, Route Handlers (`/api/v1/*`) y tipado estricto de extremo a extremo. |
| **Interfaz de Usuario** | **Tailwind CSS v4**, **Shadcn/UI**, Lucide Icons | Centro de control operativo en modo oscuro de alta densidad visual. |
| **Base de Datos & ORM** | **PostgreSQL 16**, **Drizzle ORM**, Drizzle Kit | Almacenamiento relacional transaccional y registros de auditoría en formato binario `JSONB`. |
| **Caché & Seguridad API** | **Redis 7** (`ioredis`) | Almacenamiento en memoria RAM para ventanas deslizantes de *Rate Limiting*. |
| **Colas Asíncronas** | **BullMQ** | Orquestación de trabajos en segundo plano (*Background Workers*) para auditorías masivas. |
| **Infraestructura & CI/CD** | **Docker Compose**, **Zod**, **GitHub Actions**, **Trivy** | Contenerización de servicios, validación de entorno y auditoría automatizada DevSecOps. |

---

## 📂 Estructura Modular del Proyecto

```text
koi-nexus-core/
├── .github/workflows/
│   └── ci-devsecops.yml          # Pipeline CI/CD (TypeCheck + Escáner Trivy)
├── src/
│   ├── app/
│   │   ├── _actions/             # Server Actions (Mutaciones Drizzle + Auditoría JSONB)
│   │   ├── _components/          # Panel de control interactivo y simulador API
│   │   ├── api/v1/stock/         # Endpoint REST protegido por Redis Rate Limiter
│   │   └── page.tsx              # Vista principal del Centro de Operaciones
│   ├── components/ui/            # Componentes base de Shadcn/UI
│   ├── db/
│   │   ├── schema.ts             # Definición de las 4 tablas relacionales y JSONB
│   │   ├── index.ts              # Pool de conexiones a PostgreSQL
│   │   └── seed.ts               # Script poblador de lotes, clientes API y logs
│   └── lib/
│       ├── redis.ts              # Cliente ioredis en memoria
│       ├── rate-limiter.ts       # Algoritmo de control de tráfico por minuto
│       └── queue.ts              # Productor y Worker asíncrono con BullMQ
├── docker-compose.yml            # Orquestación de Redis 7 Alpine
└── drizzle.config.ts             # Configuración de migraciones Drizzle Kit
```

---

## ⚙️ Guía Paso a Paso de Instalación y Ejecución Local

Sigue estos pasos para levantar el entorno completo de desarrollo en tu máquina local:

### 1. Prerrequisitos
* **Node.js** (v20 LTS o superior) y gestor de paquetes **pnpm**.
* **PostgreSQL 16** activo en el puerto `5432`.
* **Docker Desktop** activo (para el motor de Redis y BullMQ).

### 2. Clonar el repositorio e instalar dependencias
```bash
git clone [https://github.com/koitito/koi-nexus-core.git](https://github.com/koitito/koi-nexus-core.git)
cd koi-nexus-core
pnpm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de conexión:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/koi_nexus_db"
REDIS_URL="redis://localhost:6379"
```

### 4. Levantar el servidor Redis en Docker
```bash
docker compose up -d
```

### 5. Sincronizar el esquema en PostgreSQL y poblar datos iniciales (*Seeder*)
Ejecuta las migraciones con Drizzle Kit y carga los lotes mayoristas, clientes B2B y auditorías de prueba:
```bash
pnpm drizzle-kit push
pnpm tsx src/db/seed.ts
```

### 6. Iniciar el servidor de desarrollo
```bash
pnpm dev
```
Abre **`http://localhost:3000`** en tu navegador para acceder al Centro de Control Operativo.

---

## 🧪 Cómo Probar el Escudo de API (Endpoint REST)

Además del simulador interactivo incluido en el Dashboard, puedes probar el *Rate Limiter* directamente realizando peticiones `GET` al endpoint público:

* **Cliente Estándar (Límite permitido: 10 peticiones/minuto):**
  ```bash
  curl -X GET "http://localhost:3000/api/v1/stock?apiKey=koi_live_stgo_99887766"
  ```
* **Simulación de Bot / Scraper (Límite estricto: 3 peticiones/minuto):**
  ```bash
  curl -X GET "http://localhost:3000/api/v1/stock?apiKey=koi_test_bot_limit_3"
  ```
  *(Al realizar la 4ta petición dentro del mismo minuto, Redis interceptará el tráfico devolviendo `HTTP 429 Too Many Requests` y registrando automáticamente un incidente `CRITICAL` en PostgreSQL).*

---

## 👨‍💻 Autor

Desarrollado por **Matías** — Ingeniero en Informática.
* [GitHub (@koitito)](https://github.com/koitito)
