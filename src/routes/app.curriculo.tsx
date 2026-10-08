import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common";
import { ExperienceEditor, SkillsEditor, EducationEditor, CertificationEditor, LanguageEditor, BasicInfoForm } from "@/components/editors";
import { ResumePreview } from "@/components/ResumePreview";
import { useStore } from "@/lib/store";
import { buildBaseResume, calculateATSScore, resumeToPlainText } from "@/lib/resume-engine";
import { applyParsed, parseResume, readResumeFile, type ParsedResume } from "@/lib/resume-import";
import { downloadFile } from "@/lib/storage";
import { exportResumePdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/app/curriculo")({
  validateSearch: (s: Record<string, unknown>) => ({ importar: s["importar"] === true || s["importar"] === "true" ? true : undefined }),
  head: () => ({ meta: [{ title: "Meu Currículo — MatchCV" }, { name: "description", content: "Edite seu currículo original e importe um existente." }, { property: "og:title", content: "Meu Currículo — MatchCV" }, { property: "og:description", content: "Edite seu currículo original e importe um existente." }] }),
  component: CurriculoPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-card p-5 shadow-card"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}

function CurriculoPage() {
  const { importar } = Route.useSearch();
  const { data, update } = useStore();
  const [open, setOpen] = useState(!!importar);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const content = buildBaseResume(data);
  const ats = calculateATSScore(content);

  const runImport = () => {
    if (text.trim().length < 30) { toast.error("Cole um texto de currículo um pouco mais completo."); return; }
    setParsed(parseResume(text));
  };

  const confirmImport = () => {
    if (!parsed) return;
    update((d) => applyParsed(d, text, parsed));
    toast.success("Informações salvas. Complete experiências e formação abaixo.");
    setOpen(false); setText(""); setParsed(null);
  };

  return (
    <div>
      <PageHeader title="Meu Currículo" description="Este é o seu currículo original. As versões personalizadas nunca o alteram."
        actions={<>
          <Button variant="outline" onClick={() => setOpen(true)}><Upload /> Importar</Button>
          <Button variant="outline" onClick={() => downloadFile("curriculo-original.txt", resumeToPlainText(content), "text/plain")}><FileText /> .txt</Button>
          <Button variant="outline" onClick={async () => { try { const n = await exportResumePdf(content); toast.success(`PDF gerado: ${n}`); } catch { toast.error("Falha ao gerar PDF."); } }}><FileDown /> PDF</Button>
        </>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Section title="Dados pessoais"><BasicInfoForm /></Section>
          <Section title="Experiências"><ExperienceEditor /></Section>
          <Section title="Skills"><SkillsEditor /></Section>
          <Section title="Formação"><EducationEditor /></Section>
          <Section title="Certificações"><CertificationEditor /></Section>
          <Section title="Idiomas"><LanguageEditor /></Section>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-lg border bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between"><span className="text-sm font-medium">ATS Score</span><span className="text-2xl font-semibold tabular-nums">{ats.score}<span className="text-sm text-muted-foreground">/100</span></span></div>
            <ul className="mt-3 space-y-1 text-xs">
              {ats.checks.filter((c) => !c.label.startsWith("Palavras")).map((c) => (
                <li key={c.label} className={c.ok ? "text-success" : "text-muted-foreground"}>{c.ok ? "✓" : "○"} {c.label}</li>
              ))}
            </ul>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-lg border shadow-card"><ResumePreview content={content} /></div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setParsed(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{parsed ? "Revise suas informações antes de continuar." : "Importar currículo"}</DialogTitle>
            <DialogDescription>
              {parsed ? "A extração usa regras locais (sem IA) e pode conter erros. Corrija o que for preciso; nada é salvo até você confirmar."
                : "Envie um PDF, DOCX ou TXT, ou cole o texto do seu currículo. O arquivo é lido apenas no seu navegador."}
            </DialogDescription>
          </DialogHeader>
          {!parsed ? (
            <>
              <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole aqui o conteúdo do seu currículo…" />
              <div className="flex flex-wrap justify-between gap-2">
                <Button variant="outline" disabled={reading} onClick={() => fileRef.current?.click()}><Upload /> {reading ? "Lendo arquivo…" : "Enviar PDF, DOCX ou TXT"}</Button>
                <Button onClick={runImport}>Analisar texto</Button>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setReading(true);
                try { setText(await readResumeFile(f)); toast.success("Texto extraído. Clique em Analisar texto."); } catch (err) { toast.error(err instanceof Error ? err.message : "Falha na importação."); }
                finally { setReading(false); }
              }} />
            </>
          ) : (
            <div className="space-y-3 text-sm">
              {([["fullName", "Nome"], ["email", "Email (opcional)"], ["phone", "Telefone"], ["linkedin", "LinkedIn"]] as const).map(([k, l]) => (
                <label key={k} className="block"><span className="text-xs font-medium">{l}</span>
                  <Input value={parsed[k]} onChange={(e) => setParsed({ ...parsed, [k]: e.target.value })} /></label>
              ))}
              <label className="block"><span className="text-xs font-medium">Resumo</span>
                <Textarea rows={3} value={parsed.summary} onChange={(e) => setParsed({ ...parsed, summary: e.target.value })} /></label>
              <div><span className="text-xs font-medium">Skills identificadas (clique para remover)</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {parsed.skills.length ? parsed.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => setParsed({ ...parsed, skills: parsed.skills.filter((x) => x !== s) })}>{s} ×</Badge>
                  )) : <span className="text-muted-foreground">Nenhuma</span>}
                </div></div>
              <div><span className="text-xs font-medium">Idiomas identificados</span>
                <div className="mt-1 flex flex-wrap gap-1.5">{parsed.languages.length ? parsed.languages.map((s) => <Badge key={s} variant="outline">{s}</Badge>) : <span className="text-muted-foreground">Nenhum</span>}</div></div>
              <p className="text-xs text-muted-foreground">Experiências e formação devem ser conferidas e adicionadas no editor após a importação.</p>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setParsed(null)}>Voltar</Button>
                <Button onClick={confirmImport}>Confirmar e salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
