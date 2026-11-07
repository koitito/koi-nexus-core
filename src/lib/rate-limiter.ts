import { redis } from "./redis";
import { db } from "@/db";
import { apiClients, securityJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkApiRateLimit(apiKey: string) {
  // 1. Verificamos en Postgres si la tienda existe y está activa
  const [client] = await db
    .select()
    .from(apiClients)
    .where(eq(apiClients.apiKey, apiKey));

  if (!client || !client.isActive) {
    return {
      allowed: false,
      status: 401,
      message: "API Key inválida o revocada.",
    };
  }

  // 2. Contamos en la memoria RAM de Redis cuántas peticiones lleva en este minuto
  const redisKey = `ratelimit:${apiKey}`;
  const currentRequests = await redis.incr(redisKey);

  if (currentRequests === 1) {
    await redis.expire(redisKey, 60); // Expira en 60 segundos
  }

  const ttl = await redis.ttl(redisKey);

  // 3. Si supera el límite permitido por minuto, bloqueamos y dejamos registro en Postgres
  if (currentRequests > client.maxRequestsPerMinute) {
    if (currentRequests === client.maxRequestsPerMinute + 1) {
      await db.insert(securityJobs).values({
        jobType: "RATE_LIMIT_BREACH",
        status: "FLAGGED",
        riskLevel: "CRITICAL",
        summaryReport: `Bloqueo en Redis: '${client.storeName}' superó el límite de ${client.maxRequestsPerMinute} req/min (Intento #${currentRequests}).`,
      });
    }

    return {
      allowed: false,
      status: 429,
      storeName: client.storeName,
      limit: client.maxRequestsPerMinute,
      current: currentRequests,
      retryAfterSeconds: ttl,
      message: `Rate Limit Excedido (${client.maxRequestsPerMinute}/min). Reintenta en ${ttl}s.`,
    };
  }

  return {
    allowed: true,
    status: 200,
    storeName: client.storeName,
    limit: client.maxRequestsPerMinute,
    remaining: client.maxRequestsPerMinute - currentRequests,
    resetInSeconds: ttl,
  };
}