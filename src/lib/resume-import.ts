// Local rule-based resume parser (no AI). Extracts what it can and lets the user review.
import type { AppData, Skill } from "@/types";
import { KNOWN_SKILLS, textContains } from "./text";
import { uid } from "./storage";

export interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  skills: string[];
  summary: string;
}

export function parseResume(text: string): ParsedResume {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? "";
  const phone = text.match(/(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/)?.[0] ?? "";
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] ?? "";
  const fullName = lines.find((l) => /^[A-Za-zÀ-ÿ' ]{5,60}$/.test(l) && l.split(" ").length >= 2) ?? "";
  const skills = KNOWN_SKILLS.filter((s) => textContains(text, s));
  const idx = lines.findIndex((l) => /^(resumo|sobre|perfil|objetivo|summary)/i.test(l));
  const summary = idx >= 0 ? (lines[idx + 1] ?? "") : "";
  return { fullName, email, phone, linkedin, skills, summary };
}

export async function readResumeFile(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Arquivo muito grande (máx. 2 MB).");
  const ok = /\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/");
  if (!ok) throw new Error("Nesta versão, importe arquivos .txt ou cole o texto do seu currículo.");
  return file.text();
}

export function applyParsed(data: AppData, text: string, p: ParsedResume): AppData {
  const existing = new Set(data.skills.map((s) => s.name.toLowerCase()));
  const newSkills: Skill[] = p.skills
    .filter((s) => !existing.has(s.toLowerCase()))
    .map((name) => ({ id: uid(), name, level: "intermediario" }));
  return {
    ...data,
    originalResumeText: text,
    profile: {
      ...data.profile,
      fullName: data.profile.fullName || p.fullName,
      email: data.profile.email || p.email,
      phone: data.profile.phone || p.phone,
      linkedin: data.profile.linkedin || p.linkedin,
      summary: data.profile.summary || p.summary,
    },
    skills: [...data.skills, ...newSkills],
  };
}
