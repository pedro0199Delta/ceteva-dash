import { Card } from "./Card";

type Token = "ok" | "atencao" | "falha" | "accent" | "none";

const valorCor: Record<Token, string> = {
  ok: "text-ok",
  atencao: "text-atencao",
  falha: "text-falha",
  accent: "text-fg",
  none: "text-fg",
};

export function MetricCard({
  titulo,
  badge,
  valor,
  sub,
  token = "none",
  borda = "left",
  pulse = false,
  compact = false,
}: {
  titulo: string;
  badge?: string;
  valor: string;
  sub?: string;
  token?: Token;
  borda?: "left" | "top";
  pulse?: boolean;
  compact?: boolean;
}) {
  return (
    <Card
      edge={borda === "left" ? token : "none"}
      top={borda === "top" ? token : "none"}
      pulse={pulse}
      className={compact ? "p-3" : "p-4"}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</span>
        {badge && (
          <span className="shrink-0 rounded-md border border-line px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`mt-2 font-bold leading-tight ${valorCor[token]} ${
          compact ? "text-2xl" : "text-3xl"
        }`}
      >
        {valor}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  );
}
