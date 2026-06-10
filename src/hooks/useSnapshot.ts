"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/lib/domain/types";

interface Estado {
  snapshot: Snapshot | null;
  carregando: boolean;
  erro: string | null;
}

export function useSnapshot(intervaloMs: number) {
  const [estado, setEstado] = useState<Estado>({
    snapshot: null,
    carregando: true,
    erro: null,
  });
  const ativo = useRef(true);

  useEffect(() => {
    ativo.current = true;

    async function buscar() {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Snapshot;
        if (ativo.current) setEstado({ snapshot: data, carregando: false, erro: null });
      } catch (e) {
        if (ativo.current)
          setEstado((prev) => ({
            ...prev,
            carregando: false,
            erro: e instanceof Error ? e.message : "Erro ao carregar",
          }));
      }
    }

    buscar();
    const id = setInterval(buscar, Math.max(500, intervaloMs));
    return () => {
      ativo.current = false;
      clearInterval(id);
    };
  }, [intervaloMs]);

  return estado;
}
