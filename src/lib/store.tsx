import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AppData } from "@/types";
import { clearData, createEmptyData, loadData, saveData } from "./storage";

type Status = "loading" | "ready" | "unavailable";

interface StoreValue {
  data: AppData;
  status: Status;
  saveError: string | null;
  lastSavedAt: string | null;
  update: (fn: (d: AppData) => AppData) => void;
  replace: (d: AppData) => void;
  reset: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createEmptyData());
  const [status, setStatus] = useState<Status>("loading");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    loadData().then((r) => {
      setData(r.data);
      if (r.status === "unavailable") {
        setStatus("unavailable");
        toast.error("Armazenamento do navegador indisponível. Seus dados não serão salvos nesta sessão.");
      } else {
        setStatus("ready");
        if (r.status === "corrupted")
          toast.warning("Os dados salvos estavam corrompidos. Iniciamos uma nova sessão.");
      }
    });
  }, []);

  useEffect(() => {
    if (status !== "ready" || !dirty.current) return;
    const t = setTimeout(() => {
      saveData(data)
        .then(() => {
          setSaveError(null);
          setLastSavedAt(new Date().toISOString());
        })
        .catch((e: unknown) => {
          const quota = e instanceof DOMException && e.name === "QuotaExceededError";
          const msg = quota
            ? "Limite de armazenamento do navegador atingido. Exporte um backup e remova versões antigas."
            : "Não foi possível salvar suas alterações.";
          setSaveError(msg);
          toast.error(msg);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [data, status]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    dirty.current = true;
    setData((d) => ({ ...fn(d), updatedAt: new Date().toISOString() }));
  }, []);

  const replace = useCallback((d: AppData) => {
    dirty.current = true;
    setData(d);
  }, []);

  const reset = useCallback(async () => {
    try {
      await clearData();
    } catch {
      /* ignore */
    }
    dirty.current = false;
    setData(createEmptyData());
  }, []);

  return (
    <StoreContext.Provider value={{ data, status, saveError, lastSavedAt, update, replace, reset }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
