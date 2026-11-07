import "dotenv/config";
import { db } from "./index";
import { inventoryBatches, auditLogs, apiClients, securityJobs } from "./schema";

async function main() {
  console.log("🌱 Iniciando carga de datos en Koi Nexus Core...");

  await db.delete(auditLogs);
  await db.delete(securityJobs);
  await db.delete(apiClients);
  await db.delete(inventoryBatches);

  const insertedBatches = await db
    .insert(inventoryBatches)
    .values([
      {
        sku: "MNG-TG-BOX01",
        productName: "Tokyo Ghoul Complete Box Set (Vol 1-14)",
        category: "Editorial / Manga",
        quantity: 45,
        locationZone: "Sector A - Rack 02",
        status: "AVAILABLE",
      },
      {
        sku: "MNG-BER-DEL01",
        productName: "Berserk Deluxe Edition Vol. 1 (Hardcover)",
        category: "Editorial / Manga",
        quantity: 12,
        locationZone: "Sector A - Rack 05",
        status: "AVAILABLE",
      },
      {
        sku: "FIG-AK-LAP01",
        productName: "Arknights Lappland Elite II 1/7 Scale Figure",
        category: "Coleccionables / Figuras",
        quantity: 3,
        locationZone: "Bóveda Alta Seguridad - B1",
        status: "QUARANTINE",
      },
      {
        sku: "HW-GPU-4070S",
        productName: "NVIDIA GeForce RTX 4070 Super 12GB GDDR6X",
        category: "Hardware / GPU",
        quantity: 18,
        locationZone: "Bóveda Electrónica - E4",
        status: "AVAILABLE",
      },
      {
        sku: "MNG-GBE-OS01",
        productName: "Goodbye, Eri - Tatsuki Fujimoto (Edición Especial)",
        category: "Editorial / Manga",
        quantity: 120,
        locationZone: "Sector B - Rack 11",
        status: "AVAILABLE",
      },
    ])
    .returning();

  await db.insert(auditLogs).values([
    {
      batchId: insertedBatches[0].id,
      action: "INITIAL_IMPORT",
      operatorName: "sistema_aduana_cl",
      ipAddress: "192.168.1.10",
      previousData: { quantity: 0, status: "PENDING" },
      newData: { quantity: 45, status: "AVAILABLE" },
    },
    {
      batchId: insertedBatches[2].id,
      action: "SECURITY_QUARANTINE",
      operatorName: "m.alfaro (Admin)",
      ipAddress: "10.0.14.88",
      previousData: { quantity: 5, status: "AVAILABLE" },
      newData: { quantity: 3, status: "QUARANTINE", reason: "Diferencia de stock en conteo físico" },
    },
  ]);

  await db.insert(apiClients).values([
    {
      storeName: "MangaStore Santiago Centro",
      apiKey: "koi_live_stgo_99887766",
      maxRequestsPerMinute: 10,
      isActive: true,
    },
    {
      storeName: "Scraper Bot Sospechoso (Test)",
      apiKey: "koi_test_bot_limit_3",
      maxRequestsPerMinute: 3,
      isActive: true,
    },
  ]);

  await db.insert(securityJobs).values([
    {
      jobType: "FULL_AUDIT_SCAN",
      status: "COMPLETED",
      riskLevel: "MEDIUM",
      summaryReport: "Se detectó 1 lote en cuarentena (FIG-AK-LAP01) por discrepancia de 2 unidades en Bóveda B1.",
    },
  ]);

  console.log("✅ ¡Datos cargados con éxito en PostgreSQL!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error al cargar datos:", err);
  process.exit(1);
});