import type { StatusNivel } from "@/lib/domain/types";

const cores: Record<StatusNivel, string> = {
  ok: "bg-ok",
  atencao: "bg-atencao",
  falha: "bg-falha",
  indefinido: "bg-muted",
};

export function StatusDot({ status, size = 10 }: { status: StatusNivel; size?: number }) {
  return (
    <span
      className={`inline-block rounded-full ${cores[status]} ${status === "falha" ? "animate-pulse" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}
