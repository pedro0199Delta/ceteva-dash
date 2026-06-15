import { parseData } from "./datas";
import type { Teste, TurnoDef, TurnosConfig } from "./types";

export interface JanelaTurno {
  id: 1 | 2 | 3;
  label: string;
  inicio: Date;
  fim: Date;
}

function parseHora(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

function turnosOrdenados(config: TurnosConfig) {
  return [...config.turnos].sort(
    (a, b) => (parseHora(a.inicio) ?? 0) - (parseHora(b.inicio) ?? 0),
  );
}

/** Data/hora de referência do teste (prioriza dthGeraLog). */
export function dataReferenciaTeste(teste: Teste): Date {
  return parseData(teste.dthGeraLog) ?? new Date(teste.recebidoEm);
}

export function dataReferenciaTexto(texto: string | undefined, fallback: Date): Date {
  return parseData(texto) ?? fallback;
}

/** Classifica turno pelo horário (usa dthGeraLog quando disponível). */
export function classificarTurno(data: Date, config: TurnosConfig): TurnoDef {
  const ordenados = turnosOrdenados(config);
  const minutos = data.getHours() * 60 + data.getMinutes();
  const primeiro = parseHora(ordenados[0].inicio) ?? 0;

  for (let i = ordenados.length - 1; i >= 0; i--) {
    const inicio = parseHora(ordenados[i].inicio) ?? 0;
    if (minutos >= inicio) return ordenados[i];
  }

  // Antes do 1º turno → ainda no 3º turno (madrugada)
  if (minutos < primeiro) return ordenados[ordenados.length - 1];

  return ordenados[0];
}

/** Janela [inicio, fim) do turno vigente na data informada. */
export function janelaTurnoAtual(agora: Date, config: TurnosConfig): JanelaTurno {
  const ordenados = turnosOrdenados(config);
  const turno = classificarTurno(agora, config);
  const idx = ordenados.findIndex((t) => t.id === turno.id);
  const startMin = parseHora(ordenados[idx].inicio) ?? 0;
  const next = ordenados[(idx + 1) % ordenados.length];
  const endMin = parseHora(next.inicio) ?? 0;

  const inicio = new Date(agora);
  inicio.setSeconds(0, 0);
  inicio.setMilliseconds(0);
  inicio.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);

  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const primeiroMin = parseHora(ordenados[0].inicio) ?? 0;

  if (idx === ordenados.length - 1 && agoraMin < primeiroMin) {
    inicio.setDate(inicio.getDate() - 1);
  }

  const fim = new Date(inicio);
  if (endMin > startMin) {
    fim.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  } else {
    fim.setDate(fim.getDate() + 1);
    fim.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  }

  return { id: turno.id, label: turno.label, inicio, fim };
}

export function testeNaJanela(teste: Teste, inicio: Date, fim: Date): boolean {
  const d = dataReferenciaTeste(teste);
  return d >= inicio && d < fim;
}

export function formatarHoraCurta(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
