import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — MatchCV" }, { name: "description", content: "Preferências e privacidade." }, { property: "og:title", content: "Configurações — MatchCV" }, { property: "og:description", content: "Preferências e privacidade." }] }),
  component: () => {
    const { data, update } = useStore();
    return (
      <div>
        <PageHeader title="Configurações" />
        <div className="space-y-4 rounded-lg border bg-card p-5 text-sm">
          <label className="flex items-center justify-between gap-4">Mostrar vagas de demonstração
            <Switch checked={data.settings.showDemoJobs} onCheckedChange={(c) => update((d) => ({ ...d, settings: { ...d.settings, showDemoJobs: c } }))} />
          </label>
          <p className="text-muted-foreground">Privacidade: seus dados ficam apenas neste navegador e não são sincronizados entre dispositivos. Use Backup no menu para salvar uma cópia.</p>
        </div>
      </div>
    );
  },
});
