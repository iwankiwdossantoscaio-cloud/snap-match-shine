import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common";
import { BasicInfoForm, PreferencesForm } from "@/components/editors";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — MatchCV" }, { name: "description", content: "Dados e preferências profissionais." }, { property: "og:title", content: "Perfil — MatchCV" }, { property: "og:description", content: "Dados e preferências profissionais." }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Salvo automaticamente neste navegador." />
      <section className="rounded-lg border bg-card p-5"><BasicInfoForm /></section>
      <section className="rounded-lg border bg-card p-5"><h2 className="mb-4 font-semibold">Preferências</h2><PreferencesForm /></section>
    </div>
  ),
});
