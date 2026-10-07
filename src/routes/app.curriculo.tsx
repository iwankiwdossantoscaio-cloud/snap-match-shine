import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common";
import { ExperienceEditor, SkillsEditor, EducationEditor, CertificationEditor, LanguageEditor, BasicInfoForm } from "@/components/editors";
import { ResumePreview } from "@/components/ResumePreview";
import { useStore } from "@/lib/store";
import { buildBaseResume, calculateATSScore, resumeToPlainText } from "@/lib/resume-engine";
import { applyParsed, parseResume, readResumeFile } from "@/lib/resume-import";
import { downloadFile } from "@/lib/storage";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const content = buildBaseResume(data);
  const ats = calculateATSScore(content);

  const runImport = () => {
    if (text.trim().length < 30) { toast.error("Cole um texto de currículo um pouco mais completo."); return; }
    const parsed = parseResume(text);
    update((d) => applyParsed(d, text, parsed));
    toast.success(`Importado: ${parsed.skills.length} skills identificadas. Revise e complete os dados.`);
    setOpen(false);
    setText("");
  };

  return (
    <div>
      <PageHeader title="Meu Currículo" description="Este é o seu currículo original. As versões personalizadas nunca o alteram."
        actions={<>
          <Button variant="outline" onClick={() => setOpen(true)}><Upload /> Importar</Button>
          <Button variant="outline" onClick={() => downloadFile("curriculo-original.txt", resumeToPlainText(content), "text/plain")}><FileText /> Baixar .txt</Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar currículo</DialogTitle>
            <DialogDescription>Cole o texto do seu currículo ou envie um arquivo .txt. A extração usa regras locais (sem IA) — revise os dados depois.</DialogDescription>
          </DialogHeader>
          <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole aqui o conteúdo do seu currículo…" />
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Enviar .txt</Button>
            <Button onClick={runImport}>Importar dados</Button>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,text/plain" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try { setText(await readResumeFile(f)); } catch (err) { toast.error(err instanceof Error ? err.message : "Falha na importação."); }
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
