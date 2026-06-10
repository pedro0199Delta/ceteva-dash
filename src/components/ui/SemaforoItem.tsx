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

/** Item da faixa de semáforo do operador (pílula horizontal). */
export function SemaforoItem({ p }: { p: ParametroLeitura }) {
  const destaque = p.status === "falha";
  const texto =
    p.status === "falha" && p.texto !== "—"
      ? p.texto
      : p.id === "odu" && p.status === "falha"
        ? "SEM COM."
        : p.id === "ruido" && p.status === "falha"
          ? "FORA"
          : statusLabel[p.status];

  return (
    <Card
      edge={destaque ? "falha" : "none"}
      pulse={destaque}
      className="flex flex-col gap-1 rounded-full px-4 py-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <StatusDot status={p.status} size={12} />
          <span className="text-sm font-semibold text-fg">{p.label}</span>
        </span>
        <span className={`text-sm font-bold ${cores[p.status]}`}>{texto}</span>
      </div>
      {p.faixaLabel && p.texto !== "—" && (
        <span className="pl-5 text-[10px] text-muted">ref. {p.faixaLabel}</span>
      )}
    </Card>
  );
}
