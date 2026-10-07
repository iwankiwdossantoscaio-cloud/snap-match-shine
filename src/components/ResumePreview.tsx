import type { ResumeContent } from "@/types";

// ATS-friendly preview: single column, plain headings, no icons/tables.
export function ResumePreview({ content: c }: { content: ResumeContent }) {
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-1.5 mt-5 border-b pb-1 text-xs font-semibold uppercase tracking-wider text-foreground">{children}</h2>
  );
  if (!c.name && !c.experiences.length && !c.skills.length)
    return <p className="p-8 text-center text-sm text-muted-foreground">Seu currículo aparecerá aqui conforme você preencher o perfil.</p>;
  return (
    <article className="resume-print bg-card p-8 text-[13px] leading-relaxed text-foreground">
      <h1 className="text-2xl font-semibold">{c.name || "Seu nome"}</h1>
      {c.headline && <div className="text-muted-foreground">{c.headline}</div>}
      {c.contact.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{c.contact.join(" | ")}</div>}
      {c.summary && <><H>Resumo profissional</H><p>{c.summary}</p></>}
      {c.skills.length > 0 && <><H>Habilidades</H><p>{c.skills.join(", ")}</p></>}
      {c.experiences.length > 0 && <><H>Experiência profissional</H>
        {c.experiences.map((e, i) => (
          <div key={i} className="mb-3">
            <div className="flex flex-wrap justify-between gap-x-3"><b>{e.role} — {e.company}{e.location && `, ${e.location}`}</b><span className="text-xs text-muted-foreground">{e.period}</span></div>
            <ul className="ml-4 list-disc">{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}</>}
      {c.education.length > 0 && <><H>Formação</H>{c.education.map((e, i) => <p key={i}>{e}</p>)}</>}
      {c.certifications.length > 0 && <><H>Certificações</H>{c.certifications.map((e, i) => <p key={i}>{e}</p>)}</>}
      {c.languages.length > 0 && <><H>Idiomas</H>{c.languages.map((e, i) => <p key={i}>{e}</p>)}</>}
    </article>
  );
}
