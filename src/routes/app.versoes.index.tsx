import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Files, Pencil, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/common";
import { useStore } from "@/lib/store";
import { exportResumePdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/app/versoes/")({
  head: () => ({ meta: [{ title: "Currículos personalizados — MatchCV" }, { name: "description", content: "Suas versões ATS por vaga." }, { property: "og:title", content: "Currículos personalizados — MatchCV" }, { property: "og:description", content: "Suas versões ATS por vaga." }] }),
  component: VersoesPage,
});

type Sort = "date" | "job" | "ats" | "match";

function VersoesPage() {
  const { data, update } = useStore();
  const [sort, setSort] = useState<Sort>("date");
  if (!data.resumeVersions.length)
    return <EmptyState icon={<Files />} title="Nenhuma versão ainda" description="Abra uma vaga e clique em Criar currículo personalizado." action={<Button asChild><Link to="/app/vagas">Encontrar vagas</Link></Button>} />;
  const list = [...data.resumeVersions].sort((a, b) =>
    sort === "date" ? b.updatedAt.localeCompare(a.updatedAt) : sort === "job" ? a.name.localeCompare(b.name) : sort === "ats" ? b.atsScore - a.atsScore : b.matchScore - a.matchScore);
  return (
    <div>
      <PageHeader title="Currículos personalizados" description="Cada versão é salva separadamente. Seu currículo original permanece intacto."
        actions={<select aria-label="Ordenar" className="h-9 rounded-md border bg-background px-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="date">Mais recentes</option><option value="job">Vaga (A–Z)</option><option value="ats">Maior ATS Score</option><option value="match">Maior match</option>
        </select>} />
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((v) => (
          <li key={v.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-card">
            <div className="font-medium">{v.name}</div>
            <div className="mt-1 flex gap-4 text-sm"><span>ATS Score: <b className="tabular-nums">{v.atsScore}</b></span><span>Match: <b className="tabular-nums">{v.matchScore}%</b></span></div>
            <div className="mt-1 text-xs text-muted-foreground">Criado em {new Date(v.createdAt).toLocaleDateString("pt-BR")} · atualizado {new Date(v.updatedAt).toLocaleString("pt-BR")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm"><Link to="/app/versoes/$versionId" params={{ versionId: v.id }}><Pencil /> Editar</Link></Button>
              <Button size="sm" variant="outline" onClick={async () => { const n = await exportResumePdf(v.content, v.company); toast.success(`PDF gerado: ${n}`); }}><FileDown /> PDF</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { update((d) => ({ ...d, resumeVersions: d.resumeVersions.filter((x) => x.id !== v.id) })); toast.success("Versão excluída."); }}><Trash2 /> Excluir</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
