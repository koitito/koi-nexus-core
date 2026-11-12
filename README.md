# 🛡️ Koi Nexus Core — Enterprise B2B Logistics & API Security Engine

Plataforma de trazabilidad logística mayorista, auditoría forense inmutable y protección de tráfico distribuida. Diseñada bajo principios de arquitectura limpia, procesamiento asíncrono y prácticas **DevSecOps**.

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
