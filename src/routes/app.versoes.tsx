import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/common";
import { ResumePreview } from "@/components/ResumePreview";
import { useStore } from "@/lib/store";
import { downloadFile } from "@/lib/storage";
import { resumeToPlainText, resumeToWordHtml } from "@/lib/resume-engine";
import { Files } from "lucide-react";

export const Route = createFileRoute("/app/versoes")({
  head: () => ({ meta: [{ title: "Currículos personalizados — MatchCV" }, { name: "description", content: "Suas versões ATS por vaga." }, { property: "og:title", content: "Currículos personalizados — MatchCV" }, { property: "og:description", content: "Suas versões ATS por vaga." }] }),
  component: () => {
    const { data, update } = useStore();
    if (!data.resumeVersions.length)
      return <EmptyState icon={<Files />} title="Nenhuma versão ainda" description="Abra uma vaga e crie um currículo personalizado." action={<Button asChild><Link to="/app/vagas">Ver vagas</Link></Button>} />;
    return (
      <div>
        <PageHeader title="Currículos personalizados" description="Seu currículo original permanece intacto." />
        <div className="space-y-6">
          {data.resumeVersions.map((v) => (
            <section key={v.id} className="rounded-lg border bg-card shadow-card">
              <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b p-4">
                <div><div className="font-medium">{v.name}</div><div className="text-xs text-muted-foreground">ATS {v.atsScore}/100 · Match {v.matchScore}% · Keywords adicionadas: {v.keywords.added.join(", ") || "—"} · Ausentes: {v.keywords.missing.join(", ") || "—"}</div></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadFile(`${v.name}.txt`, resumeToPlainText(v.content), "text/plain")}>.txt</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadFile(`${v.name}.doc`, resumeToWordHtml(v.content), "application/msword")}>Word</Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>PDF</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => update((d) => ({ ...d, resumeVersions: d.resumeVersions.filter((x) => x.id !== v.id) }))}>Excluir</Button>
                </div>
              </div>
              <ResumePreview content={v.content} />
            </section>
          ))}
        </div>
      </div>
    );
  },
});
