import { createFileRoute } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common";
import { BasicInfoForm, PreferencesForm } from "@/components/editors";
import { useStore } from "@/lib/store";
import { profileCompleteness } from "@/lib/profile-completeness";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — MatchCV" }, { name: "description", content: "Dados e preferências profissionais." }, { property: "og:title", content: "Perfil — MatchCV" }, { property: "og:description", content: "Dados e preferências profissionais." }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { data } = useStore();
  const c = profileCompleteness(data);
  return (
    <div className="space-y-6">
      <PageHeader title="Meu Perfil" description="Salvo automaticamente neste navegador. Email, senha e foto não são necessários." />
      <section className="rounded-lg border bg-card p-5">
        <div className="mb-2 flex items-baseline justify-between"><h2 className="font-semibold">Perfil {c.percent}% completo</h2></div>
        <Progress value={c.percent} aria-label="Completude do perfil" />
        {c.missing.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"><span className="text-muted-foreground">Falta:</span>{c.missing.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}</div>}
      </section>
      <section className="rounded-lg border bg-card p-5"><BasicInfoForm /></section>
      <section className="rounded-lg border bg-card p-5"><h2 className="mb-4 font-semibold">Preferências</h2><PreferencesForm /></section>
    </div>
  );
}
