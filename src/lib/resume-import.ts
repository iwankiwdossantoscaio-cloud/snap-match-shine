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
  languages: string[];
}

const LANGS = ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Português", "Mandarim", "Japonês"];

export function parseResume(text: string): ParsedResume {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? "";
  const phone = text.match(/(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/)?.[0] ?? "";
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0] ?? "";
  const fullName = lines.find((l) => /^[A-Za-zÀ-ÿ' ]{5,60}$/.test(l) && l.split(" ").length >= 2) ?? "";
  const skills = KNOWN_SKILLS.filter((s) => textContains(text, s));
  const idx = lines.findIndex((l) => /^(resumo|sobre|perfil|objetivo|summary)/i.test(l));
  const summary = idx >= 0 ? (lines[idx + 1] ?? "") : "";
  const languages = LANGS.filter((l) => textContains(text, l));
  return { fullName, email, phone, linkedin, skills, summary, languages };
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let line = "";
    const out: string[] = [];
    for (const it of tc.items as { str?: string; hasEOL?: boolean }[]) {
      line += it.str ?? "";
      if (it.hasEOL) { out.push(line); line = ""; } else line += " ";
    }
    if (line) out.push(line);
    pages.push(out.join("\n"));
  }
  return pages.join("\n");
}

async function readDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return r.value;
}

export async function readResumeFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo muito grande (máx. 5 MB).");
  const name = file.name.toLowerCase();
  let text = "";
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") text = await readPdf(file);
    else if (name.endsWith(".docx")) text = await readDocx(file);
    else if (/\.(txt|md)$/.test(name) || file.type.startsWith("text/")) text = await file.text();
    else throw new Error("Formato não suportado. Envie PDF, DOCX ou TXT.");
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Formato")) throw e;
    throw new Error("Não foi possível ler o arquivo. Copie e cole o texto do currículo manualmente.");
  }
  if (text.trim().length < 30)
    throw new Error("Não encontramos texto no arquivo (pode ser uma imagem escaneada). Cole o texto manualmente.");
  return text;
}

export function applyParsed(data: AppData, text: string, p: ParsedResume): AppData {
  const existing = new Set(data.skills.map((s) => s.name.toLowerCase()));
  const newSkills: Skill[] = p.skills
    .filter((s) => !existing.has(s.toLowerCase()))
    .map((name) => ({ id: uid(), name, level: "intermediario" }));
  const existingLangs = new Set(data.languages.map((l) => l.name.toLowerCase()));
  return {
    ...data,
    originalResumeText: text,
    profile: {
      ...data.profile,
      fullName: p.fullName || data.profile.fullName,
      email: p.email || data.profile.email,
      phone: p.phone || data.profile.phone,
      linkedin: p.linkedin || data.profile.linkedin,
      summary: p.summary || data.profile.summary,
    },
    skills: [...data.skills, ...newSkills],
    languages: [
      ...data.languages,
      ...p.languages.filter((l) => !existingLangs.has(l.toLowerCase())).map((name) => ({ id: uid(), name, level: "" })),
    ],
  };
}
