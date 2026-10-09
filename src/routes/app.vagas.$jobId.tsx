import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bookmark, ExternalLink, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, ScoreRing, DemoBadge } from "@/components/common";
import { getJobById } from "@/lib/job-sources";
import { calculateMatchScore } from "@/lib/matching-engine";
import { createVersion } from "@/lib/resume-engine";
import { useStore } from "@/lib/store";
import { brl, WORKMODE_LABEL, SENIORITY_LABEL } from "@/lib/text";

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
  const saved = data.savedJobIds.includes(job.id);
  const bars: [string, number][] = [["Skills", m.skills], ["Experiência", m.experience], ["Palavras-chave", m.keywords], ["Formação", m.education], ["Localização", m.location], ["Salário", m.salary]];
  const toggleSave = () => {
    update((d) => ({ ...d, savedJobIds: saved ? d.savedJobIds.filter((x) => x !== job.id) : [...d.savedJobIds, job.id] }));
    toast.success(saved ? "Vaga removida das salvas." : "Vaga salva.");
  };
  const tailor = () => {
    if (!data.profile.fullName && !data.experiences.length) { toast.error("Comece criando seu currículo antes de personalizar."); navigate({ to: "/app/curriculo" }); return; }
    const v = createVersion(data, job);
    update((d) => ({ ...d, resumeVersions: [v, ...d.resumeVersions] }));
    toast.success("Currículo personalizado criado. Revise antes de exportar.");
    navigate({ to: "/app/versoes/$versionId", params: { versionId: v.id } });
  };
  return (
    <div>
      <PageHeader title={job.title}
        description={`${job.company} · ${job.location} · ${WORKMODE_LABEL[job.workMode]} · ${job.contractType} · ${SENIORITY_LABEL[job.seniority]}`}
        actions={<>
          <Button variant="outline" onClick={toggleSave}><Bookmark className={saved ? "fill-current" : ""} /> {saved ? "Salva" : "Salvar vaga"}</Button>
          <Button variant="outline" onClick={() => document.getElementById("match")?.scrollIntoView({ behavior: "smooth" })}><Target /> Analisar compatibilidade</Button>
          <Button onClick={tailor}><Sparkles /> Criar currículo personalizado</Button>
        </>} />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {job.isDemo && <DemoBadge />}
        <span>{job.salaryMax ? `${brl(job.salaryMin)} – ${brl(job.salaryMax)}` : "Salário não informado"}</span>
        <span>Publicada em {new Date(job.postedAt + "T12:00:00").toLocaleDateString("pt-BR")}</span>
        {job.sourceUrl ? (
          <Button asChild size="sm" variant="link"><a href={job.sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir candidatura na fonte original</a></Button>
        ) : <span>Vaga de demonstração — sem link de candidatura.</span>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-lg border bg-card p-5 text-sm shadow-card">
          <div><h2 className="mb-1 font-semibold">Descrição</h2><p>{job.description}</p></div>
          <div><h2 className="mb-1 font-semibold">Responsabilidades</h2><ul className="ml-4 list-disc">{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="mb-1 font-semibold">Requisitos</h2><ul className="ml-4 list-disc">{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="mb-2 font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => <Badge key={s} variant={m.matchedSkills.includes(s) ? "default" : "outline"}>{s}</Badge>)}
              {job.niceToHave.map((s) => <Badge key={s} variant="secondary">{s} (desejável)</Badge>)}
            </div></div>
          <div id="match" className="scroll-mt-20 rounded-md bg-muted/50 p-4">
            <h2 className="mb-1 font-semibold">Por que você combina?</h2>
            {m.strengths.length ? <ul className="ml-4 list-disc">{m.strengths.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="text-muted-foreground">Ainda não encontramos pontos fortes — complete seu perfil.</p>}
            <h2 className="mb-1 mt-4 font-semibold">O que está faltando?</h2>
            {m.gaps.length ? <ul className="ml-4 list-disc">{m.gaps.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="text-muted-foreground">Nada relevante identificado.</p>}
            <p className="mt-2 text-xs text-muted-foreground">Uma skill ausente pode apenas não estar descrita no seu currículo. Se você a possui, adicione ao perfil.</p>
            {m.recommendations.length > 0 && <div className="mt-4 rounded-md bg-highlight/60 p-3 text-highlight-foreground"><b>Recomendações</b><ul className="ml-4 list-disc">{m.recommendations.map((r) => <li key={r}>{r}</li>)}</ul></div>}
          </div>
        </div>
        <aside className="space-y-3 self-start rounded-lg border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <div className="flex justify-center"><ScoreRing score={m.overall} label="match" /></div>
          {bars.map(([l, v]) => (
            <div key={l}><div className="mb-1 flex justify-between text-xs"><span>{l}</span><span className="tabular-nums">{v}%</span></div><Progress value={v} aria-label={l} className="h-1.5" /></div>
          ))}
          <p className="text-xs text-muted-foreground">Calculado por regras locais (sem IA){m.incomplete ? ". Análise parcial: complete skills, formação e preferências para mais precisão." : "."}</p>
        </aside>
      </div>
    </div>
  );
}
