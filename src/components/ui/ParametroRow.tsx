import type { ParametroLeitura } from "@/lib/domain/types";
import { statusLabel } from "@/lib/format";
import { Card } from "./Card";
import { StatusDot } from "./StatusDot";

const cores = {
  ok: "text-ok",
  atencao: "text-atencao",
  falha: "text-falha",
  indefinido: "text-muted",
} as const;

/** Linha de parâmetro do painel da supervisão (ponto + nome + status). */
export function ParametroRow({ p }: { p: ParametroLeitura }) {
  const destaque = p.status === "falha";
  const textoStatus =
    p.id === "odu" && p.status === "falha"
      ? "SEM COM."
      : p.id === "ruido" && p.status === "falha"
        ? "FORA"
        : statusLabel[p.status];

  return (
    <Card edge={destaque ? "falha" : "none"} pulse={destaque} className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-3">
          <StatusDot status={p.status} />
          <span className="text-sm font-medium text-fg">{p.label}</span>
        </span>
        <span className={`text-sm font-bold tracking-wide ${cores[p.status]}`}>{textoStatus}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 pl-7 text-xs text-muted">
        <span className="font-semibold text-fg">{p.texto}</span>
        {p.faixaLabel && (
          <span>
            ref. {p.faixaLabel}
          </span>
        )}
      </div>
    </Card>
  );
}
