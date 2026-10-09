import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/common";
import { useStore } from "@/lib/store";
import type { Settings } from "@/types";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — MatchCV" }, { name: "description", content: "Preferências, privacidade e notificações." }, { property: "og:title", content: "Configurações — MatchCV" }, { property: "og:description", content: "Preferências, privacidade e notificações." }] }),
  component: ConfigPage,
});

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3"><div><div className="font-medium">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>{children}</div>;
}

function ConfigPage() {
  const { data, update } = useStore();
  const s = data.settings;
  const set = (p: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const toggleNotify = async (on: boolean) => {
    if (on && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const r = await Notification.requestPermission();
      if (r !== "granted") { toast.error("Permissão de notificação não concedida pelo navegador."); return; }
    }
    set({ notifyNewMatches: on });
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" />
      <section className="divide-y rounded-lg border bg-card px-5 text-sm">
        <h2 className="py-3 font-semibold">Preferências</h2>
        <Row title="Mostrar vagas de demonstração" desc="Exemplos claramente identificados para testar o sistema."><Switch checked={s.showDemoJobs} onCheckedChange={(c) => set({ showDemoJobs: c })} /></Row>
      </section>
      <section className="divide-y rounded-lg border bg-card px-5 text-sm">
        <h2 className="py-3 font-semibold">Privacidade</h2>
        <Row title="Manter texto do currículo importado" desc="Guarda o texto original neste navegador enquanto você trabalha.">
          <Switch checked={s.keepOriginalFile} onCheckedChange={(c) => { set({ keepOriginalFile: c }); if (!c) update((d) => ({ ...d, originalResumeText: "" })); }} /></Row>
        <p className="py-3 text-muted-foreground">Seus dados ficam apenas neste navegador e não são sincronizados entre dispositivos. Nenhuma informação pessoal é enviada a serviços externos. Use “Backup” no menu lateral para guardar uma cópia.</p>
      </section>
      <section className="divide-y rounded-lg border bg-card px-5 text-sm">
        <h2 className="py-3 font-semibold">Notificações</h2>
        <Row title="Avisar sobre novos matches" desc="O navegador só pedirá permissão quando você ativar esta opção."><Switch checked={s.notifyNewMatches} onCheckedChange={toggleNotify} /></Row>
        <Row title={`Match mínimo para aviso: ${s.notifyMinMatch}%`}><Slider className="max-w-[200px]" value={[s.notifyMinMatch]} min={50} max={100} step={5} onValueChange={([v]) => set({ notifyMinMatch: v ?? 75 })} aria-label="Match mínimo para aviso" /></Row>
      </section>
      <section className="rounded-lg border bg-card p-5 text-sm">
        <h2 className="mb-1 font-semibold">Inteligência artificial</h2>
        <p className="text-muted-foreground">Nesta versão, matches, ATS Score e currículos personalizados usam regras locais transparentes — nenhuma resposta é simulada como IA. A camada de IA está preparada para ser conectada com segurança no futuro.</p>
      </section>
    </div>
  );
}
