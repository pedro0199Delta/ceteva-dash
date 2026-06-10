"use client";

import type { TaxaParametro } from "@/lib/domain/types";

function cor(taxa: number): string {
  if (taxa >= 95) return "var(--ok)";
  if (taxa >= 90) return "var(--atencao)";
  return "var(--falha)";
}

/** Barras horizontais de taxa de aprovação por parâmetro. */
export function TaxaParametroChart({ dados }: { dados: TaxaParametro[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {dados.map((d) => (
        <div key={d.id} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-muted" title={d.label}>
            {d.label}
          </span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${d.amostras ? d.taxaOk : 0}%`, background: cor(d.taxaOk) }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-semibold text-fg">
            {d.amostras ? `${d.taxaOk}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
