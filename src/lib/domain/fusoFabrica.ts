export const FUSO_FABRICA = "America/Sao_Paulo";

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

/** Instante UTC a partir de relógio de parede na fábrica (São Paulo). */
export function instanteFabrica(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
  segundo = 0,
): Date {
  return new Date(
    `${ano}-${pad(mes)}-${pad(dia)}T${pad(hora)}:${pad(minuto)}:${pad(segundo)}-03:00`,
  );
}

export interface PartesFabrica {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

export function partesDataFabrica(instant: Date): PartesFabrica {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO_FABRICA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    ano: get("year"),
    mes: get("month"),
    dia: get("day"),
    hora: get("hour"),
    minuto: get("minute"),
  };
}

export function minutosNaFabrica(instant: Date): number {
  const { hora, minuto } = partesDataFabrica(instant);
  return hora * 60 + minuto;
}

export function diaAnteriorFabrica(ano: number, mes: number, dia: number): PartesFabrica {
  const ref = instanteFabrica(ano, mes, dia, 12, 0);
  return partesDataFabrica(new Date(ref.getTime() - 86_400_000));
}

export function diaSeguinteFabrica(ano: number, mes: number, dia: number): PartesFabrica {
  const ref = instanteFabrica(ano, mes, dia, 12, 0);
  return partesDataFabrica(new Date(ref.getTime() + 86_400_000));
}

export function agoraFabrica(): Date {
  return new Date();
}
