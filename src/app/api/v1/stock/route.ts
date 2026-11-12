import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/rate-limiter";
import { db } from "@/db";
import { inventoryBatches } from "@/db/schema";

export async function GET(request: NextRequest) {
  // 1. Leemos la API Key desde la cabecera (Header) 'x-api-key' o desde la URL
  const apiKey =
    request.headers.get("x-api-key") ||
    request.nextUrl.searchParams.get("apiKey");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta cabecera 'x-api-key' de autenticación B2B." },
      { status: 401 }
    );
  }

  // 2. Pasamos por el Guardia de Redis antes de tocar PostgreSQL
  const rateCheck = await checkApiRateLimit(apiKey);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: rateCheck.message,
        store: rateCheck.storeName,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
      { status: rateCheck.status }
    );
  }

  // 3. Si Redis da luz verde, consultamos el stock en PostgreSQL con Drizzle
  const stock = await db.select().from(inventoryBatches);

  return NextResponse.json({
    status: "OK",
    client: rateCheck.storeName,
    rateLimitRemaining: rateCheck.remaining,
    data: stock,
  });
}