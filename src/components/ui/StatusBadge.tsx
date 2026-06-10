import type { StatusNivel } from "@/lib/domain/types";
import { statusLabel } from "@/lib/format";

const cores: Record<StatusNivel, string> = {
  ok: "text-ok",
  atencao: "text-atencao",
  falha: "text-falha",
  indefinido: "text-muted",
};

/** Texto de status (OK / ATENÇÃO / FALHA) em cor semântica. */
export function StatusBadge({ status, texto }: { status: StatusNivel; texto?: string }) {
  return (
    <span className={`font-bold tracking-wide ${cores[status]}`}>
      {texto ?? statusLabel[status]}
    </span>
  );
}
