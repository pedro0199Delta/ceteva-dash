"use client";

import Link from "next/link";
import { useConfig } from "@/context/ConfigContext";
import { useLinhasCadastro } from "@/hooks/useLinhasCadastro";
import { useTurnosCadastro } from "@/hooks/useTurnosCadastro";
import { formatHora } from "@/lib/format";
import type { TurnoAtualInfo } from "@/lib/domain/types";

export function Topbar({
  conectado,
  ultimaAtualizacao,
  turnoAtual,
}: {
  conectado: boolean;
  ultimaAtualizacao?: string;
  turnoAtual?: TurnoAtualInfo | null;
}) {
  const { config, setConfig } = useConfig();
  const linhas = useLinhasCadastro();
  const turnos = useTurnosCadastro();
  const modoLabel = config.modo === "operador" ? "Operador" : "Supervisão";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-lg font-extrabold tracking-tight text-fg">
          CETEVA <span className="text-accent">| Elgin</span>
        </span>
        {turnoAtual && (
          <span className="rounded-md border border-line bg-panel-2 px-2 py-1 text-xs font-semibold text-muted">
            {turnoAtual.label} · {turnoAtual.inicio}–{turnoAtual.fim}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {turnos.length > 0 && (
          <select
            value={config.turnoFiltro}
            onChange={(e) => setConfig({ turnoFiltro: e.target.value })}
            className="rounded-md border border-line bg-panel px-2 py-1.5 font-semibold text-fg outline-none focus:border-accent"
            aria-label="Filtrar por turno"
          >
            <option value="">Turno atual</option>
            {turnos.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.label} ({t.inicio})
              </option>
            ))}
          </select>
        )}

        {linhas.length > 0 && (
          <select
            value={config.linhaFiltro}
            onChange={(e) => setConfig({ linhaFiltro: e.target.value })}
            className="rounded-md border border-line bg-panel px-2 py-1.5 font-semibold text-fg outline-none focus:border-accent"
            aria-label="Filtrar por linha"
          >
            <option value="">Todas as linhas</option>
            {linhas.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}

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
          href="/relatorio"
          className="rounded-md border border-line bg-panel px-3 py-1 font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          Relatório
        </Link>
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
