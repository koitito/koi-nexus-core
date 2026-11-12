import { Queue, Worker } from "bullmq";
import { db } from "@/db";
import { inventoryBatches, auditLogs, securityJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

// BullMQ necesita los datos de conexión a nuestro contenedor Redis
const connection = {
  host: "localhost",
  port: 6379,
};

// 1. Creamos la "Fila de Espera" llamada 'security-audit-queue'
export const auditQueue = new Queue("security-audit-queue", { connection });

// Evitamos que Next.js cree múltiples workers al recargar en modo desarrollo
const globalForWorker = global as unknown as { auditWorker?: Worker };

if (!globalForWorker.auditWorker) {
  // 2. Creamos el "Trabajador en Segundo Plano" que escucha esa fila
  globalForWorker.auditWorker = new Worker(
    "security-audit-queue",
    async (job) => {
      const { securityJobId } = job.data;

      // Simulamos 3 segundos de análisis matemático pesado sobre la bodega
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Analizamos todos los lotes y logs en PostgreSQL buscando anomalías
      const batches = await db.select().from(inventoryBatches);
      const logs = await db.select().from(auditLogs);

      const quarantineItems = batches.filter((b) => b.status === "QUARANTINE");
      const depletedItems = batches.filter((b) => b.quantity === 0);

      let riskLevel = "LOW";
      if (quarantineItems.length > 0 || depletedItems.length > 1) {
        riskLevel = "HIGH";
      }

      const report = `Auditoría BullMQ finalizada (${logs.length} logs inspeccionados): ${quarantineItems.length} lote(s) en cuarentena y ${depletedItems.length} lote(s) agotados detectados.`;

      // Actualizamos el registro en PostgreSQL de PROCESSING -> COMPLETED
      await db
        .update(securityJobs)
        .set({
          status: "COMPLETED",
          riskLevel,
          summaryReport: report,
        })
        .where(eq(securityJobs.id, securityJobId));
    },
    { connection }
  );
}