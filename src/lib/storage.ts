// Storage layer: swap this module for a backend adapter when accounts are introduced.
import { get, set, del } from "idb-keyval";
import type { AppData } from "@/types";

const KEY = "matchcv:data";
const SESSION_KEY = "matchcv:session";

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createEmptyData(): AppData {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    sessionId: uid(),
    createdAt: now,
    updatedAt: now,
    onboarded: false,
    profile: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      summary: "",
      desiredRoles: [],
      seniority: "",
      workModes: [],
      salaryExpectation: null,
      willingToRelocate: false,
    },
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    originalResumeText: "",
    resumeVersions: [],
    savedJobIds: [],
    settings: { showDemoJobs: true, defaultWorkMode: "" },
  };
}

export function isValidData(d: unknown): d is AppData {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    o["schemaVersion"] === 1 &&
    typeof o["sessionId"] === "string" &&
    typeof o["profile"] === "object" &&
    Array.isArray(o["experiences"]) &&
    Array.isArray(o["skills"]) &&
    Array.isArray(o["resumeVersions"])
  );
}

export type LoadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty"; data: AppData }
  | { status: "corrupted"; data: AppData }
  | { status: "unavailable"; data: AppData };

export async function loadData(): Promise<LoadResult> {
  try {
    const raw = await get(KEY);
    if (raw == null) return { status: "empty", data: createEmptyData() };
    if (!isValidData(raw)) return { status: "corrupted", data: createEmptyData() };
    const base = createEmptyData();
    return { status: "ok", data: { ...base, ...raw, settings: { ...base.settings, ...raw.settings } } };
  } catch {
    return { status: "unavailable", data: createEmptyData() };
  }
}

export async function saveData(data: AppData): Promise<void> {
  await set(KEY, data);
  try {
    localStorage.setItem(SESSION_KEY, data.sessionId);
  } catch {
    /* localStorage optional */
  }
}

export async function clearData(): Promise<void> {
  await del(KEY);
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackup(data: AppData) {
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`matchcv-backup-${date}.json`, JSON.stringify(data, null, 2), "application/json");
}

export async function readBackupFile(file: File): Promise<AppData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não é um JSON válido.");
  }
  if (!isValidData(parsed)) throw new Error("Este arquivo não parece ser um backup do MatchCV.");
  return parsed;
}
