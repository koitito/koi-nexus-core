"use client";

import { useState } from "react";
import { adjustBatchStock, testRateLimiterAction } from "../_actions/nexus-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Package, History, Zap } from "lucide-react";

type Client = {
  id: string | number;
  storeName: string;
  apiKey: string;
  maxRequestsPerMinute: number;
};

type Batch = {
  id: string | number;
  sku: string;
  productName: string;
  locationZone: string;
  quantity: number;
  status: string;
};

type AuditLog = {
  id: string | number;
  action: string;
  batchId: string | number;
  operatorName: string;
  previousData: unknown;
  newData: unknown;
};

type SecurityJob = {
  id: string | number;
  jobType: string;
  riskLevel: string;
  summaryReport: string;
};

type ControlPanelData = {
  clients: Client[];
  batches: Batch[];
  logs: AuditLog[];
  jobs: SecurityJob[];
};

type ApiFeedback = {
  allowed: boolean;
  status: number;
  message?: string;
  storeName?: string;
  remaining?: number;
  resetInSeconds?: number;
};

export function ControlPanel({ data }: { data: ControlPanelData }) {
  const [apiFeedback, setApiFeedback] = useState<ApiFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulateRequest(apiKey: string) {
    setLoading(true);
    const res = await testRateLimiterAction(apiKey);
    setApiFeedback(res);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: SIMULADOR EN VIVO DE REDIS RATE LIMITER */}
      <Card className="border-zinc-800 bg-zinc-950/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-amber-400" />
            Escudo API Gateway & Redis Rate Limiter (Prueba en Vivo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {data.clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
              >
                <div>
                  <p className="font-semibold">{client.storeName}</p>
                  <p className="font-mono text-xs text-zinc-400">Key: {client.apiKey}</p>
                  <Badge variant="outline" className="mt-1">
                    Límite Redis: {client.maxRequestsPerMinute} req / min
                  </Badge>
                </div>
                <Button
                  disabled={loading}
                  onClick={() => handleSimulateRequest(client.apiKey)}
                  variant={client.maxRequestsPerMinute <= 3 ? "destructive" : "default"}
                >
                  Disparar Petición API
                </Button>
              </div>
            ))}
          </div>

          {apiFeedback && (
            <div
              className={`rounded-md border p-4 font-mono text-sm ${
                apiFeedback.allowed
                  ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                  : "border-red-800 bg-red-950/40 text-red-300"
              }`}
            >
              <p className="font-bold">
                HTTP {apiFeedback.status} — {apiFeedback.allowed ? "ACCESO PERMITIDO POR REDIS" : "BLOQUEADO POR REDIS (429)"}
              </p>
              <p>{apiFeedback.message || `Tienda: ${apiFeedback.storeName} | Peticiones restantes este minuto: ${apiFeedback.remaining} (Reset en ${apiFeedback.resetInSeconds}s)`}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: TABLA DE INVENTARIO B2B CON TRAZABILIDAD */}
      <Card className="border-zinc-800 bg-zinc-950/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-sky-400" />
            Lotes en Bodega Mayorista (Haz clic en +1 o -1 para generar un Log JSONB)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones Auditadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.sku}</TableCell>
                  <TableCell className="font-medium">{b.productName}</TableCell>
                  <TableCell className="text-zinc-400">{b.locationZone}</TableCell>
                  <TableCell className="font-bold">{b.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "AVAILABLE" ? "default" : "destructive"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => adjustBatchStock(Number(b.id), -1)}>
                      -1 Despachar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => adjustBatchStock(Number(b.id), 5)}>
                      +5 Ingresar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SECCIÓN 3: AUDITORÍA INMUTABLE JSONB Y ALERTAS DE SEGURIDAD */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-violet-400" />
              Cámara de Auditoría Inmutable (PostgreSQL JSONB)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.logs.map((log) => (
              <div key={log.id} className="rounded border border-zinc-800 p-3 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-violet-300">{log.action} (Lote #{log.batchId})</span>
                  <span className="text-zinc-500">{log.operatorName}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-zinc-900 p-1.5 text-zinc-400">
                    ANTES: {JSON.stringify(log.previousData)}
                  </div>
                  <div className="rounded bg-zinc-900 p-1.5 text-emerald-400">
                    DESPUÉS: {JSON.stringify(log.newData)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Incidentes y Trabajos de Seguridad (Security Jobs)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.jobs.map((job) => (
              <div key={job.id} className="rounded border border-zinc-800 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{job.jobType}</span>
                  <Badge variant={job.riskLevel === "CRITICAL" ? "destructive" : "secondary"}>
                    {job.riskLevel}
                  </Badge>
                </div>
                <p className="mt-2 text-zinc-300">{job.summaryReport}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}