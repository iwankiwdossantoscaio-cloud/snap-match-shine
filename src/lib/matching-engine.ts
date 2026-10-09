// Rule-based matching engine. All scores derive from user data — no decorative numbers.
import type { AppData, Job, MatchResult } from "@/types";
import { canonical, monthsBetween, norm, textContains } from "./text";

/** Centralized weights. "salary" = preferences (salary + contract). */
export const WEIGHTS = { skills: 0.35, experience: 0.25, keywords: 0.15, role: 0.1, education: 0.05, location: 0.05, salary: 0.05 } as const;
type Cat = keyof typeof WEIGHTS;

const SENIORITY_YEARS: Record<string, number> = { estagio: 0, junior: 1, pleno: 3, senior: 5, especialista: 7, lideranca: 7 };
const DEFAULT_YEARS = 2;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
/** Partial result: score null = not enough data to evaluate (excluded and re-weighted). */
type Part = { score: number | null; strengths: string[]; gaps: string[] };

export function totalExperienceYears(data: AppData) {
  return data.experiences.reduce((acc, e) => acc + monthsBetween(e.start, e.current ? "" : e.end), 0) / 12;
}

export function profileText(data: AppData) {
  return [
    data.profile.headline, data.profile.summary, ...data.profile.desiredRoles,
    ...data.skills.map((s) => s.name),
    ...data.experiences.flatMap((e) => [e.role, e.description, ...e.achievements]),
    ...data.education.map((e) => `${e.degree} ${e.field}`),
    ...data.certifications.map((c) => c.name),
    ...data.languages.map((l) => l.name),
    data.originalResumeText,
  ].join(" \n ");
}

export function extractKeywords(job: Job): string[] {
  const set = new Map<string, string>();
  [...job.skills, ...job.niceToHave].forEach((s) => set.set(canonical(s), s));
  return [...set.values()];
}

export function userHasSkill(data: AppData, skill: string) {
  const c = canonical(skill);
  if (data.skills.some((s) => canonical(s.name) === c)) return true;
  return textContains(profileText(data), skill);
}

export const getMatchedSkills = (data: AppData, job: Job) => job.skills.filter((s) => userHasSkill(data, s));
export const getMissingSkills = (data: AppData, job: Job) => job.skills.filter((s) => !userHasSkill(data, s));
const titleWords = (job: Job) => norm(job.title).split(" ").filter((w) => w.length > 3);

export function calculateSkillsMatch(data: AppData, job: Job): Part {
  if (!job.skills.length) return { score: null, strengths: [], gaps: [] };
  if (!data.skills.length && !data.experiences.length && !data.originalResumeText) return { score: null, strengths: [], gaps: [] };
  const matched = getMatchedSkills(data, job);
  const missing = getMissingSkills(data, job);
  const nice = job.niceToHave.filter((s) => userHasSkill(data, s));
  const score = clamp((matched.length / job.skills.length) * 90 + (job.niceToHave.length ? (nice.length / job.niceToHave.length) * 10 : 10));
  return {
    score,
    strengths: matched.length ? [`Você possui ${matched.length} de ${job.skills.length} skills identificadas na vaga: ${matched.slice(0, 5).join(", ")}.`] : [],
    gaps: missing.length ? [`Skills não encontradas no seu perfil: ${missing.join(", ")}.`] : [],
  };
}

export function calculateExperienceMatch(data: AppData, job: Job): Part {
  if (!data.experiences.length) return { score: null, strengths: [], gaps: [] };
  const years = totalExperienceYears(data);
  const needed = SENIORITY_YEARS[job.seniority] ?? DEFAULT_YEARS;
  const ratio = needed === 0 ? 1 : Math.min(years / needed, 1);
  const respHits = job.responsibilities.filter((r) => norm(r).split(" ").filter((w) => w.length > 4).some((w) => norm(profileText(data)).includes(w))).length;
  const respRatio = job.responsibilities.length ? respHits / job.responsibilities.length : 0.5;
  const yrs = years.toFixed(1).replace(".", ",");
  return {
    score: clamp(ratio * 70 + respRatio * 30),
    strengths: [
      ...(years >= needed ? [`Seus ${yrs} anos de experiência atendem ao nível sugerido.`] : []),
      ...(respRatio >= 0.5 ? ["Sua experiência é compatível com as responsabilidades da vaga."] : []),
    ],
    gaps: years < needed ? [`A vaga sugere cerca de ${needed} anos de experiência; seu perfil soma ${yrs}.`] : [],
  };
}

export function calculateRoleMatch(data: AppData, job: Job): Part {
  const words = titleWords(job);
  const roles = [...data.experiences.map((e) => e.role), ...data.profile.desiredRoles, data.profile.headline].filter(Boolean);
  if (!roles.length && !data.profile.seniority) return { score: null, strengths: [], gaps: [] };
  const roleHit = roles.some((r) => words.some((w) => norm(r).includes(w)));
  const senHit = !data.profile.seniority || data.profile.seniority === job.seniority;
  return {
    score: clamp((roleHit ? 70 : 20) + (senHit ? 30 : 10)),
    strengths: roleHit ? ["Seu cargo atual ou desejado é semelhante ao da vaga."] : [],
    gaps: !senHit ? ["A senioridade da vaga é diferente da que você informou."] : [],
  };
}

export function calculateEducationMatch(data: AppData, job: Job): Part {
  if (!data.education.length) return { score: null, strengths: [], gaps: [] };
  const words = titleWords(job);
  const hit = data.education.some((e) => words.some((w) => norm(`${e.field} ${e.degree}`).includes(w)));
  const certHit = data.certifications.some((c) => extractKeywords(job).some((k) => textContains(c.name, k)));
  return { score: clamp((hit ? 90 : 75) + (certHit ? 10 : 0)), strengths: certHit ? ["Você tem certificações relacionadas à vaga."] : [], gaps: [] };
}

export function calculateKeywordMatch(data: AppData, job: Job): Part {
  const kws = extractKeywords(job);
  const text = profileText(data);
  if (!kws.length || norm(text).length < 3) return { score: null, strengths: [], gaps: [] };
  const found = kws.filter((k) => textContains(text, k));
  const score = clamp((found.length / kws.length) * 100);
  return { score, strengths: score >= 60 ? ["Seu currículo contém palavras-chave relevantes para a vaga."] : [], gaps: [] };
}

export function calculateLocationMatch(data: AppData, job: Job): Part {
  const p = data.profile;
  if (!p.workModes.length && !p.location) return { score: null, strengths: [], gaps: [] };
  let score = 100;
  const strengths: string[] = [], gaps: string[] = [];
  if (p.workModes.length) {
    if (p.workModes.includes(job.workMode)) strengths.push(`O modelo ${job.workMode} combina com sua preferência.`);
    else { score = 30; gaps.push(`O modelo de trabalho (${job.workMode}) não está entre suas preferências.`); }
  }
  const city = norm(p.location).split(",")[0] ?? "";
  if (job.workMode !== "remoto" && city && !norm(job.location).includes(city)) {
    score = p.willingToRelocate ? Math.min(score, 80) : Math.min(score, 40);
    if (!p.willingToRelocate) gaps.push(`A vaga é em ${job.location} e você não indicou disponibilidade para mudança.`);
  } else if (score === 100) strengths.push("Sua localização atende à vaga.");
  return { score, strengths, gaps };
}

export function calculateSalaryMatch(data: AppData, job: Job): Part {
  const exp = data.profile.salaryExpectation;
  if (!exp || !job.salaryMax) return { score: null, strengths: [], gaps: [] };
  if (exp <= job.salaryMax) return { score: 100, strengths: ["A faixa salarial atende à sua pretensão."], gaps: [] };
  return { score: clamp(100 - ((exp - job.salaryMax) / job.salaryMax) * 200), strengths: [], gaps: ["Sua pretensão salarial está acima da faixa informada."] };
}

export function generateMatchExplanation(data: AppData, job: Job, missing: string[], incomplete: boolean) {
  const recs: string[] = [];
  if (missing.length) recs.push(`Se você tem experiência real com ${missing.slice(0, 3).join(", ")}, adicione ao seu perfil.`);
  if (data.experiences.some((e) => !e.achievements.length)) recs.push("Adicione conquistas com resultados mensuráveis às suas experiências.");
  if (!data.profile.summary) recs.push("Escreva um resumo profissional para fortalecer seu currículo.");
  if (incomplete) recs.push("Complete seu perfil (skills, experiência, formação e preferências) para um score mais preciso.");
  return recs;
}

export function calculateMatchScore(data: AppData, job: Job): MatchResult {
  const parts: Record<Cat, Part> = {
    skills: calculateSkillsMatch(data, job),
    experience: calculateExperienceMatch(data, job),
    keywords: calculateKeywordMatch(data, job),
    role: calculateRoleMatch(data, job),
    education: calculateEducationMatch(data, job),
    location: calculateLocationMatch(data, job),
    salary: calculateSalaryMatch(data, job),
  };
  const cats = Object.keys(WEIGHTS) as Cat[];
  const evaluable = cats.filter((c) => parts[c].score !== null);
  const totalW = evaluable.reduce((a, c) => a + WEIGHTS[c], 0);
  // Re-weight proportionally across evaluable categories instead of penalizing missing data.
  const overall = totalW ? clamp(evaluable.reduce((a, c) => a + (parts[c].score as number) * WEIGHTS[c], 0) / totalW) : 0;
  const incomplete = evaluable.length < cats.length;
  const missingSkills = getMissingSkills(data, job);
  const s = (c: Cat) => parts[c].score ?? 0;
  return {
    jobId: job.id, overall,
    skills: s("skills"), experience: s("experience"), education: s("education"), keywords: s("keywords"),
    location: s("location"), salary: s("salary"), role: s("role"),
    evaluated: evaluable,
    matchedSkills: getMatchedSkills(data, job), missingSkills,
    strengths: cats.flatMap((c) => parts[c].strengths),
    gaps: cats.flatMap((c) => parts[c].gaps),
    recommendations: generateMatchExplanation(data, job, missingSkills, incomplete),
    incomplete, method: "regras-locais",
  };
}

export function scoreTone(score: number): "high" | "mid" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "mid" : "low";
}
