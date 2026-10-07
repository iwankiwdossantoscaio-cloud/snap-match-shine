// Rule-based matching engine. All scores derive from user data — no decorative numbers.
import type { AppData, Job, MatchResult } from "@/types";
import { canonical, monthsBetween, norm, textContains } from "./text";

export const WEIGHTS = { skills: 0.35, experience: 0.25, keywords: 0.15, education: 0.1, location: 0.1, salary: 0.05 };

const SENIORITY_YEARS: Record<string, number> = {
  estagio: 0, junior: 1, pleno: 3, senior: 5, especialista: 7, lideranca: 7,
};

export function totalExperienceYears(data: AppData) {
  return data.experiences.reduce((acc, e) => acc + monthsBetween(e.start, e.current ? "" : e.end), 0) / 12;
}

export function profileText(data: AppData) {
  return [
    data.profile.headline,
    data.profile.summary,
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

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function calculateMatchScore(data: AppData, job: Job): MatchResult {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];
  let incomplete = false;

  // Skills
  const matchedSkills = job.skills.filter((s) => userHasSkill(data, s));
  const missingSkills = job.skills.filter((s) => !matchedSkills.includes(s));
  const niceMatched = job.niceToHave.filter((s) => userHasSkill(data, s));
  const skills = job.skills.length
    ? clamp((matchedSkills.length / job.skills.length) * 90 + (job.niceToHave.length ? (niceMatched.length / job.niceToHave.length) * 10 : 10))
    : 50;
  if (matchedSkills.length) strengths.push(`Você possui ${matchedSkills.length} de ${job.skills.length} skills pedidas: ${matchedSkills.slice(0, 5).join(", ")}.`);
  if (missingSkills.length) gaps.push(`Skills não encontradas no seu perfil: ${missingSkills.join(", ")}.`);
  if (!data.skills.length) incomplete = true;

  // Experience
  const years = totalExperienceYears(data);
  const needed = SENIORITY_YEARS[job.seniority] ?? 2;
  const titleWords = norm(job.title).split(" ").filter((w) => w.length > 3);
  const roleHit = data.experiences.some((e) => titleWords.some((w) => norm(e.role).includes(w)));
  let experience: number;
  if (!data.experiences.length) {
    experience = needed === 0 ? 70 : 20;
    incomplete = true;
  } else {
    const ratio = needed === 0 ? 1 : Math.min(years / needed, 1.2);
    experience = clamp(ratio * 75 + (roleHit ? 25 : 0));
    if (years >= needed) strengths.push(`Seus ${years.toFixed(1).replace(".", ",")} anos de experiência atendem ao nível ${job.seniority}.`);
    else gaps.push(`A vaga sugere cerca de ${needed} anos de experiência; seu perfil soma ${years.toFixed(1).replace(".", ",")}.`);
    if (roleHit) strengths.push("Você já atuou em cargo semelhante ao da vaga.");
  }

  // Education
  let education: number;
  if (!data.education.length) {
    education = 40;
    incomplete = true;
  } else {
    const fieldHit = data.education.some((e) => titleWords.some((w) => norm(`${e.field} ${e.degree}`).includes(w)));
    education = fieldHit ? 100 : 80;
  }

  // Keywords
  const kws = extractKeywords(job);
  const text = profileText(data);
  const kwFound = kws.filter((k) => textContains(text, k));
  const keywords = kws.length ? clamp((kwFound.length / kws.length) * 100) : 50;

  // Location / work mode
  let location = 60;
  const p = data.profile;
  if (p.workModes.length) {
    location = p.workModes.includes(job.workMode) ? 100 : 30;
    if (location === 100) strengths.push(`O modelo ${job.workMode} combina com sua preferência.`);
    else gaps.push(`O modelo de trabalho (${job.workMode}) não está entre suas preferências.`);
  } else incomplete = true;
  if (job.workMode !== "remoto" && p.location && !norm(job.location).includes(norm(p.location).split(",")[0])) {
    location = p.willingToRelocate ? Math.max(location - 10, 0) : Math.min(location, 40);
  }

  // Salary
  let salary = 60;
  if (p.salaryExpectation && job.salaryMax) {
    salary = p.salaryExpectation <= job.salaryMax ? 100 : clamp(100 - ((p.salaryExpectation - job.salaryMax) / job.salaryMax) * 200);
  } else if (!p.salaryExpectation) incomplete = true;

  const overall = clamp(
    skills * WEIGHTS.skills + experience * WEIGHTS.experience + keywords * WEIGHTS.keywords +
      education * WEIGHTS.education + location * WEIGHTS.location + salary * WEIGHTS.salary,
  );

  if (missingSkills.length) recommendations.push(`Se você tem experiência real com ${missingSkills.slice(0, 3).join(", ")}, adicione ao seu perfil.`);
  if (data.experiences.some((e) => !e.achievements.length)) recommendations.push("Adicione conquistas com resultados mensuráveis às suas experiências.");
  if (!p.summary) recommendations.push("Escreva um resumo profissional para fortalecer seu currículo.");
  if (incomplete) recommendations.push("Complete seu perfil (skills, formação e preferências) para um score mais preciso.");

  return {
    jobId: job.id, overall, skills, experience, education, keywords, location, salary,
    matchedSkills, missingSkills, strengths, gaps, recommendations, incomplete, method: "regras-locais",
  };
}

export function scoreTone(score: number): "high" | "mid" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "mid" : "low";
}
