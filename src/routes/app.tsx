import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/common";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "MatchCV — Painel" },
      { name: "description", content: "Seu painel de currículo, vagas e matches no MatchCV." },
      { property: "og:title", content: "MatchCV — Painel" },
      { property: "og:description", content: "Seu painel de currículo, vagas e matches no MatchCV." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { status } = useStore();
  return <AppShell>{status === "loading" ? <LoadingBlock /> : <Outlet />}</AppShell>;
}
