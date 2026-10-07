import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, ScoreRing, DemoBadge } from "@/components/common";
import { getJobById } from "@/lib/job-sources";
import { calculateMatchScore } from "@/lib/matching-engine";
import { createVersion } from "@/lib/resume-engine";
import { useStore } from "@/lib/store";
import { brl, WORKMODE_LABEL } from "@/lib/text";

export const Route = createFileRoute("/app/vagas/$jobId")({
  head: () => ({ meta: [{ title: "Detalhes da vaga — MatchCV" }, { name: "description", content: "Veja seu match e personalize o currículo." }, { property: "og:title", content: "Detalhes da vaga — MatchCV" }, { property: "og:description", content: "Veja seu match e personalize o currículo." }] }),
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const { data, update } = useStore();
  const navigate = useNavigate();
  const job = getJobById(jobId);
  if (!job) return <p className="text-muted-foreground">Vaga não encontrada. <Link to="/app/vagas" className="text-primary-strong">Voltar</Link></p>;
  const m = calculateMatchScore(data, job);
  const bars: [string, number][] = [["Skills", m.skills], ["Experiência", m.experience], ["Palavras-chave", m.keywords], ["Formação", m.education], ["Localização", m.location], ["Salário", m.salary]];
  return (
    <div>
      <PageHeader title={job.title} description={`${job.company} · ${job.location} · ${WORKMODE_LABEL[job.workMode]} · ${brl(job.salaryMin)}–${brl(job.salaryMax)}`}
        actions={<Button onClick={() => { const v = createVersion(data, job); update((d) => ({ ...d, resumeVersions: [v, ...d.resumeVersions] })); toast.success("Currículo personalizado criado."); navigate({ to: "/app/versoes" }); }}>Criar currículo personalizado</Button>} />
      {job.isDemo && <div className="mb-4"><DemoBadge /></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-lg border bg-card p-5 text-sm shadow-card">
          <p>{job.description}</p>
          <div><h2 className="font-semibold">Responsabilidades</h2><ul className="ml-4 list-disc">{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="font-semibold">Requisitos</h2><ul className="ml-4 list-disc">{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="font-semibold">Por que você combina?</h2><ul className="ml-4 list-disc">{m.strengths.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="font-semibold">O que está faltando?</h2><ul className="ml-4 list-disc">{m.gaps.map((r) => <li key={r}>{r}</li>)}</ul></div>
        </div>
        <aside className="space-y-3 rounded-lg border bg-card p-5 shadow-card">
          <div className="flex justify-center"><ScoreRing score={m.overall} label="match" /></div>
          {bars.map(([l, v]) => (
            <div key={l}><div className="flex justify-between text-xs"><span>{l}</span><span>{v}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${v}%` }} /></div></div>
          ))}
          <p className="text-xs text-muted-foreground">Calculado por regras locais{m.incomplete ? " com dados incompletos" : ""}.</p>
        </aside>
      </div>
    </div>
  );
}
