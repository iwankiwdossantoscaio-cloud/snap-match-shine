import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/matching-engine";
import { Input } from "@/components/ui/input";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed bg-muted px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary-soft text-primary-strong">{icon}</div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const toneClass = {
  high: "bg-success/10 text-success border-success/25",
  mid: "bg-highlight text-highlight-foreground border-highlight-foreground/15",
  low: "bg-muted text-muted-foreground border-border",
};

export function ScoreBadge({ score, label = "match" }: { score: number; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums", toneClass[scoreTone(score)])}>
      {score}% <span className="font-normal opacity-80">{label}</span>
    </span>
  );
}

export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  const stroke = tone === "high" ? "var(--success)" : tone === "mid" ? "var(--warning)" : "var(--muted-foreground)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-semibold tabular-nums text-foreground">{score}</div>
        {label && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function TagInput({ value, onChange, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [text, setText] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setText("");
  };
  const sugg = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(text.toLowerCase())).slice(0, 8);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-xs font-medium text-accent-foreground">
            {t}
            <button type="button" aria-label={`Remover ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); } }} />
      {text && sugg.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sugg.map((s) => (
            <button type="button" key={s} onClick={() => add(s)} className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DemoBadge() {
  return <span className="rounded-md bg-highlight px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-highlight-foreground">Demonstração</span>;
}

export function LoadingBlock() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}
    </div>
  );
}
