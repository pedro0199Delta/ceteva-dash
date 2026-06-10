import type { Resultado, StatusNivel } from "./domain/types";

export function formatDuracao(seg: number | null): string {
  if (seg === null) return "--:--";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const statusLabel: Record<StatusNivel, string> = {
  ok: "OK",
  atencao: "ATENÇÃO",
  falha: "FALHA",
  indefinido: "—",
};

export const resultadoLabel: Record<Resultado, string> = {
  aprovado: "APROVADO",
  reprovado: "REPROVADO",
  em_teste: "EM TESTE",
  indefinido: "—",
};

/** Cor semântica do estado (CSS var token). */
export function statusToken(status: StatusNivel): "ok" | "atencao" | "falha" | "accent" {
  if (status === "ok") return "ok";
  if (status === "atencao") return "atencao";
  if (status === "falha") return "falha";
  return "accent";
}

export function resultadoToken(r: Resultado): "ok" | "atencao" | "falha" | "accent" {
  if (r === "aprovado") return "ok";
  if (r === "reprovado") return "falha";
  if (r === "em_teste") return "accent";
  return "accent";
}

export function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString("pt-BR");
}
