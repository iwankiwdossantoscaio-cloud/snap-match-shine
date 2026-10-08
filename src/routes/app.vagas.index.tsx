import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Bookmark, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader, ScoreBadge, DemoBadge, LoadingBlock, EmptyState } from "@/components/common";
import { useMatches } from "@/hooks/use-jobs";
import { hasRealSources } from "@/lib/job-sources";
import { useStore } from "@/lib/store";
import { WORKMODE_LABEL, SENIORITY_LABEL, brl, norm } from "@/lib/text";

export const Route = createFileRoute("/app/vagas/")({
  head: () => ({ meta: [{ title: "Vagas — MatchCV" }, { name: "description", content: "Pesquise e filtre vagas compatíveis." }, { property: "og:title", content: "Vagas — MatchCV" }, { property: "og:description", content: "Pesquise e filtre vagas compatíveis." }] }),
  component: VagasPage,
});

const EMPTY = { q: "", title: "", company: "", location: "", mode: "", contract: "", seniority: "", skill: "", salary: "", minMatch: 0, saved: false };

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select aria-label={label} className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: todos</option>
      {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

function VagasPage() {
  const { matches, isLoading, isError, refetch } = useMatches();
  const { data } = useStore();
  const [f, setF] = useState(EMPTY);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((s) => ({ ...s, [k]: v }));
  const contracts = useMemo(() => [...new Set(matches.map((m) => m.job.contractType))].map((c) => [c, c] as [string, string]), [matches]);
  const has = (hay: string, needle: string) => !needle || norm(hay).includes(norm(needle));

  const list = matches.filter(({ job, match }) =>
    has(`${job.title} ${job.company} ${job.skills.join(" ")} ${job.location} ${job.description}`, f.q) &&
    has(job.title, f.title) && has(job.company, f.company) && has(job.location, f.location) &&
    has(job.skills.concat(job.niceToHave).join(" "), f.skill) &&
    (!f.mode || job.workMode === f.mode) && (!f.contract || job.contractType === f.contract) &&
    (!f.seniority || job.seniority === f.seniority) &&
    (!f.salary || (job.salaryMax ?? 0) >= Number(f.salary)) &&
    match.overall >= f.minMatch && (!f.saved || data.savedJobIds.includes(job.id)));
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY);

  return (
    <div>
      <PageHeader title="Vagas" description={`${list.length} de ${matches.length} vagas`} />
      {!hasRealSources && (
        <Alert className="mb-4 border-highlight bg-highlight/40">
          <AlertTitle>Nenhuma fonte de vagas reais configurada</AlertTitle>
          <AlertDescription>As vagas abaixo são exemplos de demonstração para você testar o match e o gerador de currículo. Elas não são oportunidades reais.</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 space-y-3 rounded-lg border bg-card p-4 shadow-card">
        <Input placeholder="Buscar por cargo, empresa, skill ou cidade" value={f.q} onChange={(e) => set("q", e.target.value)} aria-label="Buscar vagas" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Cargo" value={f.title} onChange={(e) => set("title", e.target.value)} aria-label="Cargo" />
          <Input placeholder="Empresa" value={f.company} onChange={(e) => set("company", e.target.value)} aria-label="Empresa" />
          <Input placeholder="Localização" value={f.location} onChange={(e) => set("location", e.target.value)} aria-label="Localização" />
          <Input placeholder="Skill (ex.: React)" value={f.skill} onChange={(e) => set("skill", e.target.value)} aria-label="Skill" />
          <Sel label="Modelo" value={f.mode} onChange={(v) => set("mode", v)} options={Object.entries(WORKMODE_LABEL)} />
          <Sel label="Contratação" value={f.contract} onChange={(v) => set("contract", v)} options={contracts} />
          <Sel label="Nível" value={f.seniority} onChange={(v) => set("seniority", v)} options={Object.entries(SENIORITY_LABEL)} />
          <Sel label="Salário mín." value={f.salary} onChange={(v) => set("salary", v)} options={[["3000", "R$ 3.000+"], ["6000", "R$ 6.000+"], ["10000", "R$ 10.000+"], ["15000", "R$ 15.000+"]]} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex min-w-[240px] flex-1 items-center gap-3 text-sm">
            <span className="whitespace-nowrap">Match mínimo: <b className="tabular-nums">{f.minMatch}%</b></span>
            <Slider value={[f.minMatch]} max={100} step={5} onValueChange={([v]) => set("minMatch", v ?? 0)} aria-label="Match mínimo" />
          </label>
          <Button size="sm" variant={f.saved ? "default" : "outline"} onClick={() => set("saved", !f.saved)}><Bookmark /> Salvas</Button>
          <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => setF(EMPTY)}><X /> Limpar filtros</Button>
        </div>
      </div>
      {isLoading ? <LoadingBlock /> : isError ? (
        <EmptyState icon={<Briefcase />} title="Não foi possível carregar as vagas" description="Verifique sua conexão e tente novamente." action={<Button onClick={() => refetch()}>Tentar novamente</Button>} />
      ) : list.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="Nenhuma vaga encontrada" description={matches.length ? "Ajuste ou limpe os filtros." : "Ative as vagas de demonstração em Configurações."} action={dirty ? <Button onClick={() => setF(EMPTY)}>Limpar filtros</Button> : undefined} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map(({ job, match }) => (
            <li key={job.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold" aria-hidden>{job.company.charAt(0)}</div>
                  <div className="min-w-0">
                    <div className="font-medium leading-tight">{job.title}</div>
                    <div className="text-sm text-muted-foreground">{job.company}</div>
                  </div>
                </div>
                <ScoreBadge score={match.overall} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{job.location} · {WORKMODE_LABEL[job.workMode]} · {job.contractType} · {SENIORITY_LABEL[job.seniority]}</div>
              <div className="text-sm">{job.salaryMax ? `${brl(job.salaryMin)} – ${brl(job.salaryMax)}` : "Salário não informado"}</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Publicada em {new Date(job.postedAt + "T12:00:00").toLocaleDateString("pt-BR")} {job.isDemo && <DemoBadge />}
                  {data.savedJobIds.includes(job.id) && <Bookmark className="h-3.5 w-3.5 fill-current text-primary" aria-label="Salva" />}
                </div>
                <Button asChild size="sm"><Link to="/app/vagas/$jobId" params={{ jobId: job.id }}>Ver vaga</Link></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
