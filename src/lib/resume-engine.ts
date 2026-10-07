// ATS resume engine. Never invents information: it only selects, reorders and rephrases existing user data.
import type { AppData, Job, KeywordReport, ResumeContent, ResumeVersion } from "@/types";
import { extractKeywords, calculateMatchScore, userHasSkill, totalExperienceYears } from "./matching-engine";
import { canonical, formatPeriod, norm, textContains } from "./text";
import { uid } from "./storage";

export function buildBaseResume(data: AppData): ResumeContent {
  const p = data.profile;
  return {
    name: p.fullName,
    headline: p.headline,
    contact: [p.email, p.phone, p.location, p.linkedin].filter(Boolean),
    summary: p.summary,
    skills: data.skills.map((s) => s.name),
    experiences: data.experiences.map((e) => ({
      company: e.company,
      role: e.role,
      period: formatPeriod(e.start, e.end, e.current),
      location: e.location,
      bullets: [e.description, ...e.achievements].map((b) => b.trim()).filter(Boolean),
    })),
    education: data.education.map((e) =>
      [`${e.degree}${e.field ? ` em ${e.field}` : ""}`, e.institution, [e.start, e.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · "),
    ),
    certifications: data.certifications.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(" · ")),
    languages: data.languages.map((l) => `${l.name}${l.level ? ` — ${l.level}` : ""}`),
  };
}

export function resumeToText(c: ResumeContent) {
  return [
    c.name, c.headline, c.contact.join(" | "), c.summary, c.skills.join(", "),
    ...c.experiences.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...c.education, ...c.certifications, ...c.languages,
  ].join("\n");
}

export function keywordReport(original: ResumeContent, tailored: ResumeContent, job: Job): KeywordReport {
  const kws = extractKeywords(job);
  const before = resumeToText(original);
  const after = resumeToText(tailored);
  const found = kws.filter((k) => textContains(before, k));
  const nowFound = kws.filter((k) => textContains(after, k));
  return {
    found,
    added: nowFound.filter((k) => !found.includes(k)),
    missing: kws.filter((k) => !nowFound.includes(k)),
  };
}

export function generateTailoredResume(data: AppData, job: Job): ResumeContent {
  const base = buildBaseResume(data);
  const kws = extractKeywords(job);
  const relevant = (t: string) => kws.filter((k) => textContains(t, k)).length;

  // Skills: matched job skills first (only skills the user actually has)
  const userSkills = data.skills.map((s) => s.name);
  const matched = userSkills.filter((s) => kws.some((k) => canonical(k) === canonical(s)));
  // Skills that appear in experience text but not in the skills list: real, so surfaced
  const fromText = job.skills.filter(
    (k) => !userSkills.some((s) => canonical(s) === canonical(k)) && userHasSkill(data, k),
  );
  const rest = userSkills.filter((s) => !matched.includes(s));
  const skills = [...matched, ...fromText, ...rest];

  // Experiences: keep chronology but order bullets by relevance
  const experiences = base.experiences.map((e) => ({
    ...e,
    bullets: [...e.bullets].sort((a, b) => relevant(b) - relevant(a)),
  }));

  // Summary built from real data only
  const years = totalExperienceYears(data);
  const top = [...matched, ...fromText].slice(0, 5);
  const parts: string[] = [];
  const head = data.profile.headline || data.experiences[0]?.role || "";
  if (head) parts.push(`${head}${years >= 1 ? ` com ${Math.floor(years)}+ anos de experiência` : ""}.`);
  if (top.length) parts.push(`Experiência prática com ${top.join(", ")}.`);
  if (data.profile.summary) parts.push(data.profile.summary);
  const summary = parts.join(" ");

  return { ...base, headline: base.headline || job.title, skills, experiences, summary };
}

export interface ATSBreakdown {
  score: number;
  checks: { label: string; ok: boolean; weight: number }[];
}

export function calculateATSScore(c: ResumeContent, job?: Job): ATSBreakdown {
  const text = resumeToText(c);
  const bullets = c.experiences.flatMap((e) => e.bullets);
  const kwCoverage = job ? (() => {
    const kws = extractKeywords(job);
    return kws.length ? kws.filter((k) => textContains(text, k)).length / kws.length : 1;
  })() : 1;
  const checks = [
    { label: "Nome e contato presentes", ok: !!c.name && c.contact.length >= 2, weight: 12 },
    { label: "Resumo profissional", ok: c.summary.length >= 60, weight: 12 },
    { label: "Seção de skills com 5+ itens", ok: c.skills.length >= 5, weight: 12 },
    { label: "Experiências com cargo, empresa e período", ok: c.experiences.length > 0 && c.experiences.every((e) => e.role && e.company && e.period), weight: 14 },
    { label: "Conquistas com números ou resultados", ok: bullets.some((b) => /\d/.test(b)), weight: 10 },
    { label: "Formação acadêmica", ok: c.education.length > 0, weight: 8 },
    { label: "Sem caracteres especiais problemáticos", ok: !/[★●◆✓✔►•]/.test(text), weight: 7 },
    { label: "Tamanho adequado (150–1200 palavras)", ok: (() => { const w = norm(text).split(" ").length; return w >= 150 && w <= 1200; })(), weight: 5 },
  ];
  const base = checks.reduce((a, ch) => a + (ch.ok ? ch.weight : 0), 0);
  const kwPoints = Math.round(kwCoverage * 20);
  checks.push({ label: `Palavras-chave da vaga (${Math.round(kwCoverage * 100)}%)`, ok: kwCoverage >= 0.6, weight: 20 });
  return { score: Math.min(100, base + kwPoints), checks };
}

export function createVersion(data: AppData, job: Job): ResumeVersion {
  const original = buildBaseResume(data);
  const content = generateTailoredResume(data, job);
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: `${job.title} — ${job.company}`,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    createdAt: now,
    updatedAt: now,
    content,
    atsScore: calculateATSScore(content, job).score,
    matchScore: calculateMatchScore(data, job).overall,
    keywords: keywordReport(original, content, job),
    history: [],
  };
}

export function resumeToPlainText(c: ResumeContent) {
  const out: string[] = [c.name.toUpperCase(), c.headline, c.contact.join(" | "), ""];
  if (c.summary) out.push("RESUMO PROFISSIONAL", c.summary, "");
  if (c.skills.length) out.push("HABILIDADES", c.skills.join(", "), "");
  if (c.experiences.length) {
    out.push("EXPERIÊNCIA PROFISSIONAL");
    c.experiences.forEach((e) => {
      out.push(`${e.role} — ${e.company}${e.location ? `, ${e.location}` : ""}`, e.period);
      e.bullets.forEach((b) => out.push(`- ${b}`));
      out.push("");
    });
  }
  if (c.education.length) out.push("FORMAÇÃO", ...c.education, "");
  if (c.certifications.length) out.push("CERTIFICAÇÕES", ...c.certifications, "");
  if (c.languages.length) out.push("IDIOMAS", ...c.languages);
  return out.join("\n");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function resumeToWordHtml(c: ResumeContent) {
  const sec = (t: string, body: string) => `<h2 style="font-size:12pt;border-bottom:1px solid #999;margin-top:14pt">${t}</h2>${body}`;
  return `<html><head><meta charset="utf-8"></head><body style="font-family:Arial;font-size:11pt">
<h1 style="font-size:18pt;margin:0">${esc(c.name)}</h1><p>${esc(c.headline)}<br>${esc(c.contact.join(" | "))}</p>
${c.summary ? sec("Resumo profissional", `<p>${esc(c.summary)}</p>`) : ""}
${c.skills.length ? sec("Habilidades", `<p>${esc(c.skills.join(", "))}</p>`) : ""}
${c.experiences.length ? sec("Experiência profissional", c.experiences.map((e) => `<p><b>${esc(e.role)}</b> — ${esc(e.company)}${e.location ? `, ${esc(e.location)}` : ""}<br>${esc(e.period)}</p><ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`).join("")) : ""}
${c.education.length ? sec("Formação", c.education.map((e) => `<p>${esc(e)}</p>`).join("")) : ""}
${c.certifications.length ? sec("Certificações", c.certifications.map((e) => `<p>${esc(e)}</p>`).join("")) : ""}
${c.languages.length ? sec("Idiomas", c.languages.map((e) => `<p>${esc(e)}</p>`).join("")) : ""}
</body></html>`;
}
