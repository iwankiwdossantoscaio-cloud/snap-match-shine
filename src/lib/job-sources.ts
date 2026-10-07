// jobSources: each provider returns normalized Job objects. Add real providers (official APIs) here.
import type { Job } from "@/types";

export interface JobSource {
  id: string;
  label: string;
  isDemo: boolean;
  fetchJobs: () => Promise<Job[]>;
}

const demo = (j: Omit<Job, "source" | "sourceUrl" | "isDemo" | "sourceId">): Job => ({
  ...j,
  source: "demo",
  sourceId: j.id,
  sourceUrl: "",
  isDemo: true,
});

const DEMO_JOBS: Job[] = [
  demo({
    id: "demo-1",
    title: "Desenvolvedor(a) Front-end React",
    company: "Exemplo Tech (demo)",
    location: "São Paulo, SP",
    workMode: "remoto",
    seniority: "pleno",
    contractType: "CLT",
    salaryMin: 8000,
    salaryMax: 11000,
    description:
      "Buscamos pessoa desenvolvedora front-end para construir interfaces web performáticas com React e TypeScript, colaborando com design e produto em um time ágil.",
    responsibilities: [
      "Desenvolver interfaces com React e TypeScript",
      "Criar componentes reutilizáveis e acessíveis",
      "Integrar APIs REST",
      "Escrever testes automatizados",
    ],
    requirements: ["3+ anos com desenvolvimento web", "Experiência com React", "Conhecimento de Git", "Inglês intermediário"],
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git", "REST", "Testes"],
    niceToHave: ["Next.js", "Tailwind CSS", "Figma"],
    postedAt: "2026-09-28",
  }),
  demo({
    id: "demo-2",
    title: "Analista de Dados Júnior",
    company: "Varejo Exemplo (demo)",
    location: "Belo Horizonte, MG",
    workMode: "hibrido",
    seniority: "junior",
    contractType: "CLT",
    salaryMin: 4500,
    salaryMax: 6000,
    description:
      "Oportunidade para analista de dados apoiar áreas de negócio com relatórios, dashboards e análises exploratórias.",
    responsibilities: ["Construir dashboards em Power BI", "Escrever consultas SQL", "Apresentar insights para gestores"],
    requirements: ["Graduação em andamento ou completa", "SQL básico", "Excel avançado"],
    skills: ["SQL", "Excel", "Power BI", "Python", "Estatística"],
    niceToHave: ["Pandas", "Comunicação"],
    postedAt: "2026-10-01",
  }),
  demo({
    id: "demo-3",
    title: "Product Designer Sênior",
    company: "Fintech Exemplo (demo)",
    location: "Remoto - Brasil",
    workMode: "remoto",
    seniority: "senior",
    contractType: "PJ",
    salaryMin: 14000,
    salaryMax: 18000,
    description:
      "Procuramos product designer para liderar a experiência de produtos financeiros, do discovery à entrega, com foco em pesquisa e design systems.",
    responsibilities: ["Conduzir pesquisas com usuários", "Evoluir o design system", "Prototipar fluxos no Figma"],
    requirements: ["5+ anos em design de produto", "Portfólio", "Experiência com design system"],
    skills: ["Figma", "UX Research", "Design System", "Prototipação", "UI Design"],
    niceToHave: ["HTML", "CSS", "Métricas de produto"],
    postedAt: "2026-09-20",
  }),
  demo({
    id: "demo-4",
    title: "Engenheiro(a) Back-end Node.js",
    company: "Logística Exemplo (demo)",
    location: "Curitiba, PR",
    workMode: "hibrido",
    seniority: "senior",
    contractType: "CLT",
    salaryMin: 12000,
    salaryMax: 16000,
    description:
      "Time de plataforma busca engenheiro(a) back-end para APIs de alto volume em Node.js, com bancos relacionais e mensageria.",
    responsibilities: ["Projetar APIs escaláveis", "Modelar dados em PostgreSQL", "Monitorar serviços em produção"],
    requirements: ["5+ anos com back-end", "Node.js", "PostgreSQL", "Docker"],
    skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "REST", "Microsserviços"],
    niceToHave: ["Kafka", "Kubernetes"],
    postedAt: "2026-09-30",
  }),
  demo({
    id: "demo-5",
    title: "Analista de Marketing Digital",
    company: "E-commerce Exemplo (demo)",
    location: "Rio de Janeiro, RJ",
    workMode: "presencial",
    seniority: "pleno",
    contractType: "CLT",
    salaryMin: 5000,
    salaryMax: 7000,
    description:
      "Responsável por campanhas de aquisição, SEO e análise de performance de canais digitais.",
    responsibilities: ["Gerenciar campanhas pagas", "Otimizar SEO", "Analisar métricas no Google Analytics"],
    requirements: ["2+ anos em marketing digital", "Google Ads", "Google Analytics"],
    skills: ["Google Ads", "SEO", "Google Analytics", "Copywriting", "Excel"],
    niceToHave: ["Meta Ads", "CRM"],
    postedAt: "2026-09-25",
  }),
  demo({
    id: "demo-6",
    title: "Estágio em Desenvolvimento Web",
    company: "Startup Exemplo (demo)",
    location: "Florianópolis, SC",
    workMode: "hibrido",
    seniority: "estagio",
    contractType: "Estágio",
    salaryMin: 1800,
    salaryMax: 2200,
    description: "Estágio para estudantes de tecnologia que querem aprender desenvolvimento web em um time colaborativo.",
    responsibilities: ["Apoiar o desenvolvimento de páginas web", "Corrigir bugs", "Participar de code reviews"],
    requirements: ["Cursando Ciência da Computação ou áreas afins", "Noções de HTML, CSS e JavaScript"],
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    niceToHave: ["React"],
    postedAt: "2026-10-03",
  }),
  demo({
    id: "demo-7",
    title: "Gerente de Projetos",
    company: "Consultoria Exemplo (demo)",
    location: "São Paulo, SP",
    workMode: "hibrido",
    seniority: "lideranca",
    contractType: "CLT",
    salaryMin: 15000,
    salaryMax: 20000,
    description: "Liderar projetos de transformação digital, coordenando times multidisciplinares e stakeholders.",
    responsibilities: ["Planejar cronogramas e orçamentos", "Gerir riscos", "Conduzir cerimônias ágeis"],
    requirements: ["7+ anos com gestão de projetos", "Scrum", "Certificação PMP desejável"],
    skills: ["Gestão de Projetos", "Scrum", "Liderança", "Comunicação", "Jira"],
    niceToHave: ["PMP", "Kanban"],
    postedAt: "2026-09-15",
  }),
  demo({
    id: "demo-8",
    title: "Desenvolvedor(a) Full Stack",
    company: "SaaS Exemplo (demo)",
    location: "Remoto - Brasil",
    workMode: "remoto",
    seniority: "pleno",
    contractType: "PJ",
    salaryMin: 10000,
    salaryMax: 13000,
    description: "Construir funcionalidades ponta a ponta em um produto SaaS B2B usando React, Node.js e PostgreSQL.",
    responsibilities: ["Desenvolver features front-end e back-end", "Escrever testes", "Participar do design técnico"],
    requirements: ["3+ anos com desenvolvimento", "React e Node.js", "SQL"],
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Git", "Testes"],
    niceToHave: ["AWS", "Docker", "Tailwind CSS"],
    postedAt: "2026-10-02",
  }),
];

export const demoSource: JobSource = {
  id: "demo",
  label: "Exemplos de demonstração",
  isDemo: true,
  fetchJobs: async () => DEMO_JOBS,
};

/** Real providers go here (e.g. official job board APIs). Empty in this version. */
export const realSources: JobSource[] = [];

export async function fetchAllJobs(includeDemo: boolean): Promise<Job[]> {
  const sources = [...realSources, ...(includeDemo ? [demoSource] : [])];
  const results = await Promise.all(sources.map((s) => s.fetchJobs().catch(() => [] as Job[])));
  return results.flat();
}

export function getJobById(id: string): Job | undefined {
  return DEMO_JOBS.find((j) => j.id === id);
}

export const hasRealSources = realSources.length > 0;
