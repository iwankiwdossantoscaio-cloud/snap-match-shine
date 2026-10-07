import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Upload, Search, Sparkles, ShieldCheck, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppShell";
import { ScoreRing } from "@/components/common";
import { useStore } from "@/lib/store";
import { hasProfile } from "@/hooks/use-jobs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatchCV — Encontre vagas que combinam com você" },
      { name: "description", content: "Descubra vagas compatíveis com seu perfil e crie currículos ATS personalizados para cada vaga. Sem cadastro." },
      { property: "og:title", content: "MatchCV — Encontre vagas que combinam com você" },
      { property: "og:description", content: "Match inteligente entre seu currículo e vagas, com currículos ATS-friendly personalizados." },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "01", t: "Crie seu perfil", d: "Monte ou importe seu currículo em poucos minutos." },
  { n: "02", t: "Encontre vagas compatíveis", d: "Veja seu percentual de match e entenda o porquê." },
  { n: "03", t: "Personalize seu currículo", d: "Gere uma versão ATS-friendly para cada vaga." },
];
const BENEFITS = [
  { i: Target, t: "Match inteligente", d: "Score calculado a partir de skills, experiência, formação e preferências." },
  { i: FileText, t: "Currículo personalizado", d: "Uma versão por vaga, sem tocar no seu original." },
  { i: ShieldCheck, t: "ATS Friendly", d: "Estrutura limpa e palavras-chave relevantes." },
  { i: Eye, t: "Transparência", d: "Nada é inventado. Você revisa tudo antes de exportar." },
];

function Landing() {
  const { data } = useStore();
  const started = hasProfile(data);
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
        <Logo />
        <Button asChild variant="outline" size="sm"><Link to="/app">{started ? "Continuar" : "Abrir app"}</Link></Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-highlight px-2.5 py-1 text-xs font-medium text-highlight-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Sem cadastro. Comece agora.
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Encontre vagas que combinam com você.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Descubra oportunidades compatíveis com seu perfil e crie currículos personalizados para cada vaga.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg"><Link to="/app/onboarding">Criar meu currículo <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/app/curriculo" search={{ importar: true }}><Upload /> Importar currículo</Link></Button>
            <Button asChild size="lg" variant="ghost"><Link to="/app/vagas"><Search /> Explorar vagas</Link></Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Seus dados ficam salvos apenas neste navegador.</p>
        </div>

        <div className="relative">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Exemplo de análise</div>
                <div className="mt-1 font-semibold">Desenvolvedor(a) Front-end React</div>
                <div className="text-sm text-muted-foreground">Remoto · Pleno</div>
              </div>
              <ScoreRing score={86} size={84} label="match" />
            </div>
            <div className="mt-5 space-y-3">
              {[["Skills", 92], ["Experiência", 85], ["Palavras-chave", 78], ["Localização", 100]].map(([l, v]) => (
                <div key={l as string}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{l}</span><span className="tabular-nums">{v}%</span></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-highlight p-3 text-sm text-highlight-foreground">
              Faltando: <b>Testes automatizados</b>. Se você tem essa experiência, adicione ao perfil.
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 hidden rounded-lg border bg-card px-4 py-3 shadow-card sm:block">
            <div className="text-xs text-muted-foreground">ATS Score</div>
            <div className="text-2xl font-semibold tabular-nums">89<span className="text-sm text-muted-foreground">/100</span></div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <h2 className="text-2xl font-semibold">Como funciona</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border bg-card p-5">
                <div className="text-sm font-semibold text-primary-strong">{s.n}</div>
                <div className="mt-2 font-medium">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.t}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary-strong"><b.i className="h-4 w-4" /></div>
              <div className="mt-3 font-medium">{b.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between lg:px-8">
          <span>MatchCV — Encontre a vaga certa. Mostre o seu melhor currículo.</span>
          <span>Dados armazenados localmente no seu navegador.</span>
        </div>
      </footer>
    </div>
  );
}
