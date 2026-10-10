import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Briefcase, Target, Files, User, Settings, Download, Upload, Trash2, Menu, HardDrive, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { exportBackup, readBackupFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/curriculo", label: "Meu Currículo", icon: FileText },
  { to: "/app/vagas", label: "Vagas", icon: Briefcase },
  { to: "/app/matches", label: "Matches", icon: Target },
  { to: "/app/versoes", label: "Currículos Personalizados", icon: Files },
  { to: "/app/perfil", label: "Perfil", icon: User },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">M</span>
      MatchCV
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { data, status, saveError, replace, reset } = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<"clear" | "new" | null>(null);

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      replace(await readBackupFile(f));
      toast.success("Backup importado com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao importar backup.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4"><Logo /></div>
      <nav className="flex-1 space-y-0.5 px-2" aria-label="Principal">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} onClick={onNavigate} activeOptions={{ exact: "exact" in n }}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-accent font-medium text-sidebar-accent-foreground" }}>
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t p-3">
        <div className="flex items-start gap-2 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
          <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <div className="font-medium text-foreground">
              {status === "unavailable" ? "Armazenamento indisponível" : saveError ? "Erro ao salvar" : "Sessão local ativa"}
            </div>
            Dados salvos apenas neste navegador{status === "loading" ? "" : ` · #${data.sessionId.slice(0, 6)}`}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" onClick={() => exportBackup(data)}><Download /> Backup</Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Importar</Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm("new")}><Plus /> Nova</Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm("clear")} className="text-destructive"><Trash2 /> Limpar</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "new" ? "Iniciar nova sessão?" : "Limpar dados locais?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "new"
                ? "Vamos baixar um backup da sessão atual e começar uma nova, vazia."
                : "Todos os dados deste navegador serão apagados. Essa ação não pode ser desfeita. Considere exportar um backup antes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (confirm === "new") exportBackup(data);
              await reset();
              toast.success(confirm === "new" ? "Nova sessão iniciada." : "Dados locais apagados.");
              setConfirm(null);
              navigate({ to: "/app" });
            }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu /></Button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm"><Link to="/app/vagas">Explorar vagas</Link></Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
