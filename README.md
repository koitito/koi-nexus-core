# 🛡️ Koi Nexus Core — Enterprise B2B Logistics & API Security Engine

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

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
