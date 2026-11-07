"use server";

import { db } from "@/db";
import { inventoryBatches, auditLogs, apiClients, securityJobs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { checkApiRateLimit } from "@/lib/rate-limiter";
import { revalidatePath } from "next/cache";

// 1. Obtener todos los datos para el Dashboard principal
export async function getDashboardData() {
  const batches = await db.select().from(inventoryBatches).orderBy(inventoryBatches.id);
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
  const clients = await db.select().from(apiClients).orderBy(apiClients.id);
  const jobs = await db.select().from(securityJobs).orderBy(desc(securityJobs.createdAt)).limit(10);

  return { batches, logs, clients, jobs };
}

// 2. Ajustar stock dejando rastro inmutable en Audit Logs (JSONB Antes/Después)
export async function adjustBatchStock(batchId: number, delta: number) {
  const [currentBatch] = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.id, batchId));

  if (!currentBatch) return;

  const newQuantity = Math.max(0, currentBatch.quantity + delta);
  const newStatus = newQuantity === 0 ? "DEPLETED" : currentBatch.status;

  // Actualizamos el lote
  await db
    .update(inventoryBatches)
    .set({ quantity: newQuantity, status: newStatus, updatedAt: new Date() })
    .where(eq(inventoryBatches.id, batchId));

  // Guardamos la fotografía ANTES y DESPUÉS en audit_logs
  await db.insert(auditLogs).values({
    batchId: currentBatch.id,
    action: delta > 0 ? "STOCK_RESTOCK" : "STOCK_DISPATCH",
    operatorName: "m.alfaro (Operator)",
    ipAddress: "127.0.0.1",
    previousData: { quantity: currentBatch.quantity, status: currentBatch.status },
    newData: { quantity: newQuantity, status: newStatus, change: delta },
  });

  revalidatePath("/");
}

// 3. Simular petición a la API protegida por Redis
export async function testRateLimiterAction(apiKey: string) {
  const result = await checkApiRateLimit(apiKey);
  revalidatePath("/");
  return result;
}