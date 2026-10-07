import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BasicInfoForm, ExperienceEditor, SkillsEditor, PreferencesForm, EducationEditor } from "@/components/editors";
import { ResumePreview } from "@/components/ResumePreview";
import { useStore } from "@/lib/store";
import { buildBaseResume } from "@/lib/resume-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Criar currículo — MatchCV" }, { name: "description", content: "Monte seu perfil profissional em 5 passos." }, { property: "og:title", content: "Criar currículo — MatchCV" }, { property: "og:description", content: "Monte seu perfil profissional em 5 passos." }] }),
  component: Onboarding,
});

const STEPS = ["Informações básicas", "Experiência", "Skills", "Preferências", "Currículo"];

function Onboarding() {
  const [step, setStep] = useState(0);
  const { data, update } = useStore();
  const navigate = useNavigate();
  const canNext = step !== 0 || data.profile.fullName.trim().length > 1;

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ${i === step ? "bg-primary-soft font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${i < step ? "bg-primary text-primary-foreground" : "border"}`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>
      <div className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
        <h1 className="mb-1 text-xl font-semibold">{STEPS[step]}</h1>
        <p className="mb-5 text-sm text-muted-foreground">Tudo é salvo automaticamente neste navegador.</p>
        {step === 0 && <BasicInfoForm />}
        {step === 1 && <div className="space-y-6"><ExperienceEditor /><div><h2 className="mb-2 text-sm font-medium">Formação</h2><EducationEditor /></div></div>}
        {step === 2 && <SkillsEditor />}
        {step === 3 && <PreferencesForm />}
        {step === 4 && <div className="max-h-[60vh] overflow-auto rounded-md border"><ResumePreview content={buildBaseResume(data)} /></div>}
      </div>
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Continuar</Button>
        ) : (
          <Button onClick={() => { update((d) => ({ ...d, onboarded: true })); toast.success("Currículo criado!"); navigate({ to: "/app/matches" }); }}>Ver meus matches</Button>
        )}
      </div>
    </div>
  );
}
