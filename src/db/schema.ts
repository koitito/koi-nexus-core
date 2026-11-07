import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// 1. LOTES DE INVENTARIO (Stock mayorista en bodega)
export const inventoryBatches = pgTable("inventory_batches", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  locationZone: text("location_zone").notNull(),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, QUARANTINE, DEPLETED
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. AUDITORÍA INMUTABLE (Guarda el "Antes" y "Después" en formato JSONB)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").references(() => inventoryBatches.id),
  action: text("action").notNull(), // INITIAL_IMPORT, STOCK_UPDATE, SECURITY_QUARANTINE
  operatorName: text("operator_name").notNull(),
  ipAddress: text("ip_address").notNull(),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. CLIENTES API B2B (Tiendas que consultan stock y su límite por minuto para Redis)
export const apiClients = pgTable("api_clients", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  maxRequestsPerMinute: integer("max_requests_per_minute").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. TRABAJOS DE SEGURIDAD Y ALERTAS (Para las colas asíncronas y bloqueos de Redis)
export const securityJobs = pgTable("security_jobs", {
  id: serial("id").primaryKey(),
  jobType: text("job_type").notNull(), // FULL_AUDIT_SCAN, RATE_LIMIT_BREACH
  status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FLAGGED
  riskLevel: text("risk_level").default("LOW"), // LOW, MEDIUM, CRITICAL
  summaryReport: text("summary_report"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});