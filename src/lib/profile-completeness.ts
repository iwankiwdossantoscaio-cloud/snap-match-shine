import type { AppData } from "@/types";

export function profileCompleteness(d: AppData) {
  const p = d.profile;
  const items: [string, boolean][] = [
    ["Nome", !!p.fullName],
    ["Título profissional", !!p.headline],
    ["Localização", !!p.location],
    ["Telefone ou LinkedIn", !!(p.phone || p.linkedin)],
    ["Resumo profissional", p.summary.length >= 40],
    ["Cargo desejado", p.desiredRoles.length > 0],
    ["Modelo de trabalho", p.workModes.length > 0],
    ["Pretensão salarial", !!p.salaryExpectation],
    ["Experiência profissional", d.experiences.length > 0],
    ["Formação", d.education.length > 0],
    ["5+ skills", d.skills.length >= 5],
    ["Idiomas", d.languages.length > 0],
  ];
  const done = items.filter(([, ok]) => ok).length;
  return { percent: Math.round((done / items.length) * 100), missing: items.filter(([, ok]) => !ok).map(([l]) => l) };
}
