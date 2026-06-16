import {
  FUSO_FABRICA,
  instanteFabrica,
  partesDataFabrica,
} from "./fusoFabrica";

/** Aceita "dd/MM/yyyy HH:mm:ss" e "yyyy-MM-dd HH:mm:ss" (horário da fábrica). */
export function parseData(texto: string | undefined): Date | null {
  if (!texto) return null;
  const t = texto.trim();

  let m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, dd, MM, yyyy, hh, mi, ss] = m;
    return instanteFabrica(+yyyy, +MM, +dd, +hh, +mi, +ss);
  }

  m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, yyyy, MM, dd, hh, mi, ss] = m;
    return instanteFabrica(+yyyy, +MM, +dd, +hh, +mi, +ss);
  }

  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Aceita "HH:mm:ss" ou "mm:ss" (campo tempo_teste enviado pelo CETEVA). */
export function parseTempoTeste(texto: unknown): number | null {
  if (texto === undefined || texto === null) return null;
  const t = String(texto).trim();
  if (!t) return null;

  let m = t.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, hh, mi, ss] = m;
    return +hh * 3600 + +mi * 60 + +ss;
  }
  m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, mi, ss] = m;
    return +mi * 60 + +ss;
  }
  return null;
}

/** Hora curta no fuso da fábrica. */
export function formatarHoraFabrica(instant: Date): string {
  return instant.toLocaleTimeString("pt-BR", {
    timeZone: FUSO_FABRICA,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Hora cheia (para tendência) no fuso da fábrica. */
export function horaFabrica(instant: Date): number {
  return partesDataFabrica(instant).hora;
}
