"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Modo = "operador" | "supervisao";
export type Tema = "dark" | "light" | "system";

export interface Config {
  modo: Modo;
  tema: Tema;
  intervaloMs: number;
  /** Nome da linha cadastrada — vazio = todas. */
  linhaFiltro: string;
}

const PADRAO: Config = {
  modo: "operador",
  tema: "dark",
  intervaloMs: 2000,
  linhaFiltro: "",
};

const CHAVE = "dashdelta:config";

interface ConfigCtx {
  config: Config;
  setConfig: (patch: Partial<Config>) => void;
  carregado: boolean;
}

const Ctx = createContext<ConfigCtx | null>(null);

function aplicarTema(tema: Tema) {
  if (typeof document === "undefined") return;
  const escuro =
    tema === "dark" ||
    (tema === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setEstado] = useState<Config>(PADRAO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) {
        const parsed = { ...PADRAO, ...JSON.parse(salvo) } as Config;
        setEstado(parsed);
        aplicarTema(parsed.tema);
      } else {
        aplicarTema(PADRAO.tema);
      }
    } catch {
      aplicarTema(PADRAO.tema);
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (config.tema !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => aplicarTema("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [config.tema]);

  const setConfig = useCallback((patch: Partial<Config>) => {
    setEstado((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(CHAVE, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (patch.tema) aplicarTema(patch.tema);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ config, setConfig, carregado }), [config, setConfig, carregado]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConfig() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfig deve ser usado dentro de ConfigProvider");
  return ctx;
}
