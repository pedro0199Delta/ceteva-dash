"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoTendencia } from "@/lib/domain/types";

export function TendenciaChart({ dados }: { dados: PontoTendencia[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={dados} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-desvio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="hora"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--line)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "var(--panel-2)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            color: "var(--fg)",
          }}
          labelStyle={{ color: "var(--muted)" }}
          formatter={(v) => [v as number, "Reprovações"]}
        />
        <Area
          type="monotone"
          dataKey="desvios"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#grad-desvio)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
