import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileDown, FileText, History, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common";
import { ResumePreview } from "@/components/ResumePreview";
import { useStore } from "@/lib/store";
import { getJobById } from "@/lib/job-sources";
import { calculateATSScore, buildBaseResume, keywordReport, resumeToWordHtml } from "@/lib/resume-engine";
import { exportResumePdf, resumeFileName } from "@/lib/pdf-export";
import { downloadFile } from "@/lib/storage";
import type { ResumeContent, ResumeVersion } from "@/types";

export const Route = createFileRoute("/app/versoes/$versionId")({
  head: () => ({ meta: [{ title: "Editar currículo personalizado — MatchCV" }, { name: "description", content: "Edite sua versão ATS com preview A4." }, { property: "og:title", content: "Editar currículo personalizado — MatchCV" }, { property: "og:description", content: "Edite sua versão ATS com preview A4." }] }),
  component: VersionEditor,
});

function VersionEditor() {
  const { versionId } = Route.useParams();
  const { data, update, saveError, lastSavedAt } = useStore();
  const v = data.resumeVersions.find((x) => x.id === versionId);
  if (!v) return <p className="text-muted-foreground">Versão não encontrada. <Link to="/app/versoes" className="text-primary-strong">Voltar</Link></p>;
  const job = getJobById(v.jobId);
  const ats = calculateATSScore(v.content, job);
  const kw = job ? keywordReport(buildBaseResume(data), v.content, job) : v.keywords;

  const patchVersion = (fn: (x: ResumeVersion) => ResumeVersion) =>
    update((d) => ({ ...d, resumeVersions: d.resumeVersions.map((x) => (x.id === v.id ? fn(x) : x)) }));
  const setContent = (c: Partial<ResumeContent>) =>
    patchVersion((x) => {
      const content = { ...x.content, ...c };
      return { ...x, content, updatedAt: new Date().toISOString(), atsScore: calculateATSScore(content, job).score };
    });
  const snapshot = () => { patchVersion((x) => ({ ...x, history: [{ at: new Date().toISOString(), content: x.content }, ...x.history].slice(0, 10) })); toast.success("Ponto do histórico salvo."); };
  const restore = (c: ResumeContent) => { setContent(c); toast.success("Versão restaurada."); };

  const editor = (
    <div className="space-y-4 rounded-lg border bg-card p-5 text-sm shadow-card">
      <label className="block"><span className="text-xs font-medium">Título profissional</span><Input value={v.content.headline} onChange={(e) => setContent({ headline: e.target.value })} /></label>
      <label className="block"><span className="text-xs font-medium">Resumo profissional</span><Textarea rows={5} value={v.content.summary} onChange={(e) => setContent({ summary: e.target.value })} /></label>
      <label className="block"><span className="text-xs font-medium">Habilidades (separadas por vírgula, na ordem desejada)</span>
        <Textarea rows={3} value={v.content.skills.join(", ")} onChange={(e) => setContent({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></label>
      {v.content.experiences.map((e, i) => (
        <label key={i} className="block"><span className="text-xs font-medium">{e.role} — {e.company} (um tópico por linha)</span>
          <Textarea rows={4} value={e.bullets.join("\n")} onChange={(ev) => setContent({ experiences: v.content.experiences.map((x, j) => (j === i ? { ...x, bullets: ev.target.value.split("\n") } : x)) })} /></label>
      ))}
      <p className="text-xs text-muted-foreground">Edite apenas com informações verdadeiras. Empresas, cargos e datas vêm do seu currículo original.</p>
    </div>
  );
  const preview = <div className="mx-auto aspect-[210/297] w-full max-w-[640px] overflow-auto border bg-card shadow-card"><ResumePreview content={v.content} /></div>;

  return (
    <div>
      <PageHeader title={v.name} description={saveError ?? (lastSavedAt ? `Salvo automaticamente às ${new Date(lastSavedAt).toLocaleTimeString("pt-BR")}` : "Salvo automaticamente neste navegador")}
        actions={<>
          <Button variant="outline" onClick={snapshot}><Save /> Salvar no histórico</Button>
          <Button variant="outline" onClick={() => { downloadFile(resumeFileName(v.content, v.company, "doc"), resumeToWordHtml(v.content), "application/msword"); toast.success("Arquivo Word gerado."); }}><FileText /> Word</Button>
          <Button onClick={async () => { try { toast.success(`PDF gerado: ${await exportResumePdf(v.content, v.company)}`); } catch { toast.error("Falha ao gerar PDF."); } }}><FileDown /> PDF</Button>
        </>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">ATS Score</div><div className="text-2xl font-semibold tabular-nums">{ats.score}/100</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Match com a vaga</div><div className="text-2xl font-semibold tabular-nums">{v.matchScore}%</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Palavras-chave cobertas</div><div className="text-2xl font-semibold tabular-nums">{kw.found.length + kw.added.length}/{kw.found.length + kw.added.length + kw.missing.length}</div></div>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2">{editor}{preview}</div>
      <Tabs defaultValue="editor" className="lg:hidden">
        <TabsList className="w-full"><TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger><TabsTrigger value="preview" className="flex-1">Visualização</TabsTrigger></TabsList>
        <TabsContent value="editor">{editor}</TabsContent>
        <TabsContent value="preview">{preview}</TabsContent>
      </Tabs>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="mb-2 font-semibold">Fatores do ATS Score</h2>
          <ul className="space-y-1 text-xs">{ats.checks.map((c) => <li key={c.label} className={c.ok ? "text-success" : "text-muted-foreground"}>{c.ok ? "✓" : "○"} {c.label}</li>)}</ul>
          <p className="mt-2 text-xs text-muted-foreground">Métrica interna de estrutura e alinhamento — não é a pontuação oficial de nenhum sistema ATS.</p>
        </section>
        <section className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <div><h2 className="mb-1 font-semibold">Keywords encontradas</h2><div className="flex flex-wrap gap-1">{kw.found.map((k) => <Badge key={k}>{k}</Badge>)}{!kw.found.length && "—"}</div></div>
          <div><h2 className="mb-1 font-semibold">Keywords adicionadas</h2><div className="flex flex-wrap gap-1">{kw.added.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}{!kw.added.length && "—"}</div><p className="mt-1 text-xs text-muted-foreground">Só termos com evidência no seu histórico.</p></div>
          <div><h2 className="mb-1 font-semibold">Keywords ausentes</h2><div className="flex flex-wrap gap-1">{kw.missing.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}{!kw.missing.length && "—"}</div></div>
          {kw.missing.length > 0 && <p className="rounded-md bg-highlight/60 p-2 text-xs text-highlight-foreground">Se você realmente tem experiência com {kw.missing.slice(0, 3).join(", ")}, adicione ao seu currículo original e gere a versão novamente.</p>}
        </section>
        <section className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="mb-2 flex items-center gap-1.5 font-semibold"><History className="h-4 w-4" /> Histórico</h2>
          {v.history.length ? (
            <ul className="space-y-1.5">{v.history.map((h) => (
              <li key={h.at} className="flex items-center justify-between gap-2 text-xs">{new Date(h.at).toLocaleString("pt-BR")}
                <Button size="sm" variant="ghost" onClick={() => restore(h.content)}><RotateCcw /> Restaurar</Button></li>
            ))}</ul>
          ) : <p className="text-xs text-muted-foreground">Use “Salvar no histórico” para guardar pontos que você pode restaurar.</p>}
        </section>
      </div>
    </div>
  );
}
