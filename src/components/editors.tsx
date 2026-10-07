import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { CandidateProfile, Certification, Education, Experience, Language, Skill, WorkMode } from "@/types";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/storage";
import { KNOWN_SKILLS, SENIORITY_LABEL, WORKMODE_LABEL, formatPeriod } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "./common";

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function BasicInfoForm() {
  const { data, update } = useStore();
  const p = data.profile;
  const set = (patch: Partial<CandidateProfile>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome completo" htmlFor="fn"><Input id="fn" value={p.fullName} onChange={(e) => set({ fullName: e.target.value })} /></Field>
      <Field label="Título profissional" htmlFor="hl"><Input id="hl" placeholder="Ex.: Desenvolvedora Front-end" value={p.headline} onChange={(e) => set({ headline: e.target.value })} /></Field>
      <Field label="Email" htmlFor="em"><Input id="em" type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} /></Field>
      <Field label="Telefone" htmlFor="ph"><Input id="ph" value={p.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
      <Field label="Cidade / Estado" htmlFor="lo"><Input id="lo" placeholder="São Paulo, SP" value={p.location} onChange={(e) => set({ location: e.target.value })} /></Field>
      <Field label="LinkedIn" htmlFor="li"><Input id="li" value={p.linkedin} onChange={(e) => set({ linkedin: e.target.value })} /></Field>
      <div className="sm:col-span-2">
        <Field label="Resumo profissional" htmlFor="su">
          <Textarea id="su" rows={4} value={p.summary} placeholder="Conte em poucas linhas quem você é profissionalmente." onChange={(e) => set({ summary: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

export function PreferencesForm() {
  const { data, update } = useStore();
  const p = data.profile;
  const set = (patch: Partial<CandidateProfile>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const toggleMode = (m: WorkMode) => set({ workModes: p.workModes.includes(m) ? p.workModes.filter((x) => x !== m) : [...p.workModes, m] });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Cargos desejados"><TagInput value={p.desiredRoles} onChange={(v) => set({ desiredRoles: v })} placeholder="Digite e pressione Enter" /></Field>
      </div>
      <Field label="Senioridade">
        <Select value={p.seniority} onValueChange={(v) => set({ seniority: v as CandidateProfile["seniority"] })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{Object.entries(SENIORITY_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Pretensão salarial (R$/mês)" htmlFor="sal">
        <Input id="sal" type="number" min={0} value={p.salaryExpectation ?? ""} onChange={(e) => set({ salaryExpectation: e.target.value ? Number(e.target.value) : null })} />
      </Field>
      <Field label="Modelo de trabalho">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WORKMODE_LABEL) as WorkMode[]).map((m) => (
            <button key={m} type="button" onClick={() => toggleMode(m)} aria-pressed={p.workModes.includes(m)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${p.workModes.includes(m) ? "border-primary bg-primary-soft text-accent-foreground" : "hover:bg-muted"}`}>
              {WORKMODE_LABEL[m]}
            </button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <Checkbox checked={p.willingToRelocate} onCheckedChange={(c) => set({ willingToRelocate: !!c })} /> Aceito mudar de cidade
      </label>
    </div>
  );
}

const emptyExp = (): Experience => ({ id: uid(), company: "", role: "", start: "", end: "", current: false, location: "", description: "", achievements: [] });

export function ExperienceEditor() {
  const { data, update } = useStore();
  const [editing, setEditing] = useState<Experience | null>(null);
  const save = () => {
    if (!editing) return;
    if (!editing.company.trim() || !editing.role.trim()) return;
    update((d) => {
      const exists = d.experiences.some((e) => e.id === editing.id);
      return { ...d, experiences: exists ? d.experiences.map((e) => (e.id === editing.id ? editing : e)) : [editing, ...d.experiences] };
    });
    setEditing(null);
  };
  return (
    <div className="space-y-3">
      {data.experiences.map((e) => (
        <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <div className="font-medium">{e.role} <span className="font-normal text-muted-foreground">· {e.company}</span></div>
            <div className="text-xs text-muted-foreground">{formatPeriod(e.start, e.end, e.current)}{e.location && ` · ${e.location}`}</div>
            {e.achievements.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{e.achievements.length} conquista(s)</div>}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditing(e)}><Pencil /></Button>
            <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => update((d) => ({ ...d, experiences: d.experiences.filter((x) => x.id !== e.id) }))}><Trash2 /></Button>
          </div>
        </div>
      ))}
      {editing ? (
        <div className="space-y-3 rounded-lg border bg-muted p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cargo *"><Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></Field>
            <Field label="Empresa *"><Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></Field>
            <Field label="Início"><Input type="month" value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} /></Field>
            <Field label="Fim"><Input type="month" disabled={editing.current} value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} /></Field>
            <Field label="Local"><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Checkbox checked={editing.current} onCheckedChange={(c) => setEditing({ ...editing, current: !!c, end: "" })} /> Trabalho atual
            </label>
          </div>
          <Field label="Descrição das atividades"><Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Conquistas (uma por linha, de preferência com números reais)">
            <Textarea rows={3} value={editing.achievements.join("\n")} onChange={(e) => setEditing({ ...editing, achievements: e.target.value.split("\n") })} />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => { setEditing((x) => x && { ...x, achievements: x.achievements.filter((a) => a.trim()) }); setTimeout(save); }} disabled={!editing.company.trim() || !editing.role.trim()}>Salvar experiência</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setEditing(emptyExp())}><Plus /> Adicionar experiência</Button>
      )}
    </div>
  );
}

export function SkillsEditor() {
  const { data, update } = useStore();
  const names = data.skills.map((s) => s.name);
  return (
    <TagInput value={names} suggestions={KNOWN_SKILLS} placeholder="Ex.: React, SQL, Comunicação…"
      onChange={(v) => update((d) => ({
        ...d,
        skills: v.map((name) => d.skills.find((s) => s.name === name) ?? ({ id: uid(), name, level: "intermediario" } as Skill)),
      }))} />
  );
}

type ListKey = "education" | "certifications" | "languages";
type Row = Education | Certification | Language;

function SimpleList<T extends Row>({ listKey, fields, make, render }: {
  listKey: ListKey; fields: { key: keyof T; label: string; type?: string }[]; make: () => T; render: (r: T) => string;
}) {
  const { data, update } = useStore();
  const items = data[listKey] as unknown as T[];
  const [draft, setDraft] = useState<T | null>(null);
  const first = fields[0].key;
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span>{render(r)}</span>
          <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => update((d) => ({ ...d, [listKey]: (d[listKey] as Row[]).filter((x) => x.id !== r.id) }))}><Trash2 /></Button>
        </div>
      ))}
      {draft ? (
        <div className="space-y-3 rounded-lg border bg-muted p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field key={String(f.key)} label={f.label}>
                <Input type={f.type ?? "text"} value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              </Field>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!String(draft[first] ?? "").trim()} onClick={() => { update((d) => ({ ...d, [listKey]: [...(d[listKey] as Row[]), draft] })); setDraft(null); }}>Adicionar</Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setDraft(make())}><Plus /> Adicionar</Button>
      )}
    </div>
  );
}

export function EducationEditor() {
  return <SimpleList<Education> listKey="education"
    fields={[{ key: "degree", label: "Grau (ex.: Bacharelado)" }, { key: "field", label: "Curso / Área" }, { key: "institution", label: "Instituição" }, { key: "start", label: "Início (ano)" }, { key: "end", label: "Conclusão (ano)" }]}
    make={() => ({ id: uid(), degree: "", field: "", institution: "", start: "", end: "" })}
    render={(e) => `${e.degree}${e.field ? ` em ${e.field}` : ""} · ${e.institution}`} />;
}
export function CertificationEditor() {
  return <SimpleList<Certification> listKey="certifications"
    fields={[{ key: "name", label: "Certificação" }, { key: "issuer", label: "Emissor" }, { key: "year", label: "Ano" }]}
    make={() => ({ id: uid(), name: "", issuer: "", year: "" })}
    render={(c) => [c.name, c.issuer, c.year].filter(Boolean).join(" · ")} />;
}
export function LanguageEditor() {
  return <SimpleList<Language> listKey="languages"
    fields={[{ key: "name", label: "Idioma" }, { key: "level", label: "Nível" }]}
    make={() => ({ id: uid(), name: "", level: "" })}
    render={(l) => `${l.name}${l.level ? ` — ${l.level}` : ""}`} />;
}
