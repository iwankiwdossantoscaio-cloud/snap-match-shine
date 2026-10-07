export type WorkMode = "remoto" | "hibrido" | "presencial";
export type Seniority = "estagio" | "junior" | "pleno" | "senior" | "especialista" | "lideranca";

export interface CandidateProfile {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  desiredRoles: string[];
  seniority: Seniority | "";
  workModes: WorkMode[];
  salaryExpectation: number | null;
  willingToRelocate: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  start: string; // YYYY-MM
  end: string; // YYYY-MM or ""
  current: boolean;
  location: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface Skill {
  id: string;
  name: string;
  level: "basico" | "intermediario" | "avancado";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface Job {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  isDemo: boolean;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  seniority: Seniority;
  contractType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  niceToHave: string[];
  postedAt: string;
}

export interface MatchResult {
  jobId: string;
  overall: number;
  skills: number;
  experience: number;
  education: number;
  keywords: number;
  location: number;
  salary: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  incomplete: boolean;
  method: "regras-locais";
}

export interface ResumeContent {
  name: string;
  headline: string;
  contact: string[];
  summary: string;
  skills: string[];
  experiences: { company: string; role: string; period: string; location: string; bullets: string[] }[];
  education: string[];
  certifications: string[];
  languages: string[];
}

export interface KeywordReport {
  found: string[];
  missing: string[];
  added: string[];
}

export interface ResumeVersion {
  id: string;
  name: string;
  jobId: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  content: ResumeContent;
  atsScore: number;
  matchScore: number;
  keywords: KeywordReport;
  history: { at: string; content: ResumeContent }[];
}

export interface Settings {
  showDemoJobs: boolean;
  defaultWorkMode: WorkMode | "";
}

export interface AppData {
  schemaVersion: 1;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean;
  profile: CandidateProfile;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  languages: Language[];
  originalResumeText: string;
  resumeVersions: ResumeVersion[];
  savedJobIds: string[];
  settings: Settings;
}
