"use client";

import { useEffect, useState } from "react";

export function useLinhasCadastro() {
  const [linhas, setLinhas] = useState<string[]>([]);

  useEffect(() => {
    let ativo = true;
    fetch("/api/linhas", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (ativo) setLinhas(d.linhas ?? []);
      })
      .catch(() => {
        if (ativo) setLinhas([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return linhas;
}
