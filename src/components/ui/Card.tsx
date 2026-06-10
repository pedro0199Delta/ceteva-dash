import type { ReactNode } from "react";

type Token = "ok" | "atencao" | "falha" | "accent" | "none";

const edgeClass: Record<Token, string> = {
  ok: "edge-ok",
  atencao: "edge-atencao",
  falha: "edge-falha",
  accent: "edge-accent",
  none: "",
};

const topClass: Record<Token, string> = {
  ok: "top-ok",
  atencao: "top-atencao",
  falha: "top-falha",
  accent: "top-accent",
  none: "",
};

export function Card({
  children,
  edge = "none",
  top = "none",
  pulse = false,
  className = "",
}: {
  children: ReactNode;
  edge?: Token;
  top?: Token;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-line bg-panel",
        edge !== "none" ? edgeClass[edge] : "",
        top !== "none" ? topClass[top] : "",
        pulse ? "alerta-falha" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
