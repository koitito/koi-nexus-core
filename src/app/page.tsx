import { getDashboardData } from "./_actions/nexus-actions";
import { ControlPanel } from "./_components/control-panel";

export const instant = false;

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Koi Nexus Core — B2B Logistics & API Security Engine
          </h1>
          <p className="text-sm text-zinc-400">
            Trazabilidad inmutable en PostgreSQL (JSONB) + Protección de tráfico distribuida en Redis
          </p>
        </header>

        <ControlPanel
          data={{
            ...data,
            logs: data.logs.map((log) => ({
              ...log,
              batchId: log.batchId ?? "N/A",
            })),
            jobs: data.jobs.map((job) => ({
              ...job,
              riskLevel: job.riskLevel ?? "UNKNOWN",
              summaryReport: job.summaryReport ?? "N/A",
            })),
          }}
        />
      </div>
    </main>
  );
}
