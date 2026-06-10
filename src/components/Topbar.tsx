"use client";

import Link from "next/link";
import { useConfig } from "@/context/ConfigContext";
import { formatHora } from "@/lib/format";

export function Topbar({
  conectado,
  ultimaAtualizacao,
}: {
  conectado: boolean;
  ultimaAtualizacao?: string;
}) {
  const { config } = useConfig();
  const modoLabel = config.modo === "operador" ? "Operador" : "Supervisão";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-extrabold tracking-tight text-fg">
          CETEVA <span className="text-accent">| DashDelta</span>
        </span>
        <span className="hidden text-xs text-muted sm:inline">
          Interface operacional de fábrica
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              conectado ? "bg-ok" : "bg-falha animate-pulse"
            }`}
          />
          {conectado ? "Recebendo dados" : "Aguardando dados"}
        </span>
        {ultimaAtualizacao && (
          <span className="hidden text-muted md:inline">· {formatHora(ultimaAtualizacao)}</span>
        )}
        <span className="rounded-md border border-line px-2 py-1 font-semibold text-muted">
          {modoLabel}
        </span>
        <Link
          href="/config"
          className="rounded-md border border-line bg-panel px-3 py-1 font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          ⚙ Configuração
        </Link>
      </div>
    </header>
  );
}
