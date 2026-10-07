import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Upload, Search, Target, Files, Gauge, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, ScoreBadge, DemoBadge, LoadingBlock } from "@/components/common";
import { useStore } from "@/lib/store";
import { useMatches, hasProfile } from "@/hooks/use-jobs";
import { buildBaseResume, calculateATSScore } from "@/lib/resume-engine";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — MatchCV" }, { name: "description", content: "Resumo dos seus matches, currículo e ATS score." }, { property: "og:title", content: "Dashboard — MatchCV" }, { property: "og:description", content: "Resumo dos seus matches, currículo e ATS score." }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Target; label: string; value: React.ReactNode; hint?: string | undefined }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const { data } = useStore();
  const { matches, isLoading } = useMatches();

  if (!hasProfile(data)) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-3xl font-semibold">Bem-vindo ao MatchCV</h1>
        <p className="mt-2 text-muted-foreground">Comece criando ou importando seu currículo. Nenhum cadastro é necessário.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { to: "/app/onboarding", icon: FileText, t: "Criar meu currículo", d: "Passo a passo guiado" },
            { to: "/app/curriculo", icon: Upload, t: "Importar currículo", d: "Cole o texto ou envie .txt", search: { importar: true } },
            { to: "/app/vagas", icon: Search, t: "Explorar vagas", d: "Veja as oportunidades" },
          ].map((a) => (
            <Link key={a.t} to={a.to} search={a.search as never} className="rounded-lg border bg-card p-5 text-left shadow-card transition-colors hover:border-primary">
              <a.icon className="h-5 w-5 text-primary-strong" />
              <div className="mt-3 font-medium">{a.t}</div>
              <div className="text-sm text-muted-foreground">{a.d}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const first = data.profile.fullName.split(" ")[0];
  const good = matches.filter((m) => m.match.overall >= 60);
  const best = matches[0];
  const ats = calculateATSScore(buildBaseResume(data)).score;
  const isDemo = matches.some((m) => m.job.isDemo);

  return (
    <div>
      <PageHeader title={`Olá${first ? `, ${first}` : ""}`} description="Aqui está o resumo da sua busca."
        actions={<Button asChild><Link to="/app/matches">Ver matches <ArrowRight /></Link></Button>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Target} label="Matches encontrados" value={good.length} hint="Vagas com 60% ou mais" />
        <Stat icon={Gauge} label="Melhor match" value={best ? `${best.match.overall}%` : "—"} hint={best?.job.title} />
        <Stat icon={FileText} label="ATS Score do original" value={`${ats}/100`} hint="Estrutura e completude" />
        <Stat icon={Files} label="Currículos personalizados" value={data.resumeVersions.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Top vagas para você</h2>
            {isDemo && <DemoBadge />}
          </div>
          {isLoading ? <LoadingBlock /> : (
            <ul className="divide-y">
              {matches.slice(0, 5).map(({ job, match }) => (
                <li key={job.id}>
                  <Link to="/app/vagas/$jobId" params={{ jobId: job.id }} className="flex items-center justify-between gap-3 py-3 hover:text-primary-strong">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{job.title}</div>
                      <div className="truncate text-sm text-muted-foreground">{job.company} · {job.location}</div>
                    </div>
                    <ScoreBadge score={match.overall} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h2 className="font-semibold">Próximos passos</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(best?.match.recommendations ?? ["Adicione skills e experiências ao seu perfil."]).slice(0, 4).map((r) => (
              <li key={r} className="rounded-md bg-highlight p-2.5 text-highlight-foreground">{r}</li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-4 w-full"><Link to="/app/curriculo" search={{ importar: undefined }}>Editar currículo</Link></Button>
        </section>
      </div>
    </div>
  );
}
