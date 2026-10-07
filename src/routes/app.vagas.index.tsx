import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { PageHeader, ScoreBadge, DemoBadge, LoadingBlock } from "@/components/common";
import { useMatches } from "@/hooks/use-jobs";
import { WORKMODE_LABEL, SENIORITY_LABEL, norm } from "@/lib/text";

export const Route = createFileRoute("/app/vagas/")({
  head: () => ({ meta: [{ title: "Vagas — MatchCV" }, { name: "description", content: "Pesquise e filtre vagas compatíveis." }, { property: "og:title", content: "Vagas — MatchCV" }, { property: "og:description", content: "Pesquise e filtre vagas compatíveis." }] }),
  component: VagasPage,
});

function VagasPage() {
  const { matches, isLoading } = useMatches();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("");
  const list = matches.filter(({ job }) =>
    (!q || norm(`${job.title} ${job.company} ${job.skills.join(" ")} ${job.location}`).includes(norm(q))) && (!mode || job.workMode === mode));
  return (
    <div>
      <PageHeader title="Vagas" description="Vagas de demonstração enquanto nenhuma fonte real está configurada." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar por cargo, empresa, skill ou cidade" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Modelo">
          <option value="">Todos os modelos</option>
          {Object.entries(WORKMODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      {isLoading ? <LoadingBlock /> : list.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma vaga encontrada.</p> : (
        <ul className="space-y-2">
          {list.map(({ job, match }) => (
            <li key={job.id}>
              <Link to="/app/vagas/$jobId" params={{ jobId: job.id }} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-card hover:border-primary">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">{job.title} {job.isDemo && <DemoBadge />}</div>
                  <div className="text-sm text-muted-foreground">{job.company} · {job.location} · {WORKMODE_LABEL[job.workMode]} · {SENIORITY_LABEL[job.seniority]}</div>
                </div>
                <ScoreBadge score={match.overall} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
