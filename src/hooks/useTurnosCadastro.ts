"use client";

import { useEffect, useState } from "react";
import type { TurnoDef } from "@/lib/domain/types";

export function useTurnosCadastro() {
  const [turnos, setTurnos] = useState<TurnoDef[]>([]);

  useEffect(() => {
    let ativo = true;
    fetch("/api/turnos", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (ativo) setTurnos(d.turnos ?? []);
      })
      .catch(() => {
        if (ativo) setTurnos([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return turnos;
}
