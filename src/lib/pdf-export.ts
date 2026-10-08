// Real, text-based (searchable) single-column PDF export — ATS friendly.
import type { ResumeContent } from "@/types";

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)/g, "").trim().replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");

export function resumeFileName(c: ResumeContent, company?: string, ext = "pdf") {
  const parts = [slug(c.name) || "Curriculo", "Curriculo"];
  if (!slug(c.name)) parts.pop();
  if (company) parts.push(slug(company));
  return `${parts.filter(Boolean).join("_")}.${ext}`;
}

export async function exportResumePdf(c: ResumeContent, company?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 18, W = 210 - M * 2, BOTTOM = 297 - M;
  let y = M;
  const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
  const text = (t: string, size = 10, style: "normal" | "bold" = "normal", indent = 0) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(t, W - indent) as string[];
    for (const l of lines) { ensure(size * 0.45); doc.text(l, M + indent, y); y += size * 0.45; }
  };
  const heading = (t: string) => {
    y += 3; ensure(8);
    text(t.toUpperCase(), 11, "bold");
    doc.setLineWidth(0.2); doc.line(M, y - 2.5, M + W, y - 2.5); y += 1.5;
  };
  text(c.name || "Currículo", 18, "bold"); y += 1;
  if (c.headline) text(c.headline, 11);
  if (c.contact.length) text(c.contact.join(" | "), 9);
  if (c.summary) { heading("Resumo profissional"); text(c.summary); }
  if (c.skills.length) { heading("Habilidades"); text(c.skills.join(", ")); }
  if (c.experiences.length) {
    heading("Experiência profissional");
    c.experiences.forEach((e) => {
      text(`${e.role} — ${e.company}${e.location ? `, ${e.location}` : ""}`, 10, "bold");
      if (e.period) text(e.period, 9);
      e.bullets.forEach((b) => text(`- ${b}`, 10, "normal", 3));
      y += 2;
    });
  }
  if (c.education.length) { heading("Formação"); c.education.forEach((e) => text(e)); }
  if (c.certifications.length) { heading("Certificações"); c.certifications.forEach((e) => text(e)); }
  if (c.languages.length) { heading("Idiomas"); c.languages.forEach((e) => text(e)); }
  const name = resumeFileName(c, company);
  doc.save(name);
  return name;
}
