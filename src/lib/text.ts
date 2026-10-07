export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "node.js": ["node", "nodejs"],
  postgresql: ["postgres"],
  react: ["react.js", "reactjs"],
  "next.js": ["nextjs", "next"],
  "tailwind css": ["tailwind"],
  "ux research": ["pesquisa com usuarios", "user research"],
  "power bi": ["powerbi"],
  "gestao de projetos": ["project management", "gerenciamento de projetos"],
  testes: ["testing", "testes automatizados", "jest", "vitest"],
  rest: ["api rest", "apis rest", "restful"],
};

export function canonical(skill: string): string {
  const n = norm(skill);
  for (const [k, list] of Object.entries(SYNONYMS)) {
    if (n === k || list.includes(n)) return k;
  }
  return n;
}

export function textContains(haystack: string, term: string): boolean {
  const h = ` ${norm(haystack)} `;
  const c = canonical(term);
  const variants = [c, ...(SYNONYMS[c] ?? [])];
  return variants.some((v) => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[\\s,(/])${escaped}($|[\\s,)/.])`).test(h);
  });
}

export const KNOWN_SKILLS = [
  "React", "TypeScript", "JavaScript", "HTML", "CSS", "Git", "REST", "Testes", "Next.js", "Tailwind CSS",
  "Figma", "SQL", "Excel", "Power BI", "Python", "Estatística", "Pandas", "Comunicação", "UX Research",
  "Design System", "Prototipação", "UI Design", "Node.js", "PostgreSQL", "Docker", "AWS", "Microsserviços",
  "Kafka", "Kubernetes", "Google Ads", "SEO", "Google Analytics", "Copywriting", "Meta Ads", "CRM",
  "Gestão de Projetos", "Scrum", "Liderança", "Jira", "Kanban", "PMP", "Java", "C#", ".NET", "PHP",
  "Vue", "Angular", "MongoDB", "Linux", "Azure", "GCP", "Inglês", "Espanhol",
];

export function monthsBetween(start: string, end: string): number {
  if (!start) return 0;
  const [sy = 0, sm = 1] = start.split("-").map(Number);
  const [ey = 0, em = 1] = end ? end.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const m = (ey - sy) * 12 + (em - (sm || 1)) + 1;
  return Number.isFinite(m) && m > 0 ? m : 0;
}

export function formatPeriod(start: string, end: string, current: boolean) {
  const f = (s: string) => {
    if (!s) return "";
    const [y, m] = s.split("-");
    return m ? `${m}/${y}` : y;
  };
  return `${f(start)} – ${current ? "Atual" : f(end) || "—"}`;
}

export const SENIORITY_LABEL: Record<string, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
  lideranca: "Liderança",
};

export const WORKMODE_LABEL: Record<string, string> = {
  remoto: "Remoto",
  hibrido: "Híbrido",
  presencial: "Presencial",
};

export function brl(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
