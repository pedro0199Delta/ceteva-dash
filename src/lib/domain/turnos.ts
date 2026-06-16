import {
  agoraFabrica,
  diaAnteriorFabrica,
  diaSeguinteFabrica,
  instanteFabrica,
  minutosNaFabrica,
  partesDataFabrica,
} from "./fusoFabrica";
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

function instanteFromMinutos(ano: number, mes: number, dia: number, minutos: number) {
  return instanteFabrica(ano, mes, dia, Math.floor(minutos / 60), minutos % 60);
}

/** Data/hora de referência do teste (prioriza dthGeraLog). */
export function dataReferenciaTeste(teste: Teste): Date {
  return parseData(teste.dthGeraLog) ?? new Date(teste.recebidoEm);
}

/** Classifica turno pelo horário da fábrica (São Paulo). */
export function classificarTurno(referencia: Date, config: TurnosConfig): TurnoDef {
  const ordenados = turnosOrdenados(config);
  const minutos = minutosNaFabrica(referencia);
  const primeiro = parseHora(ordenados[0].inicio) ?? 0;

  for (let i = ordenados.length - 1; i >= 0; i--) {
    const inicio = parseHora(ordenados[i].inicio) ?? 0;
    if (minutos >= inicio) return ordenados[i];
  }

  if (minutos < primeiro) return ordenados[ordenados.length - 1];

  return ordenados[0];
}

/** Janela [inicio, fim) de um turno específico na data de referência. */
export function janelaTurnoPorId(
  referencia: Date,
  config: TurnosConfig,
  turnoId: 1 | 2 | 3,
): JanelaTurno {
  const ordenados = turnosOrdenados(config);
  const idx = ordenados.findIndex((t) => t.id === turnoId);
  const turno = ordenados[idx >= 0 ? idx : 0];
  const startMin = parseHora(turno.inicio) ?? 0;
  const next = ordenados[(idx + 1) % ordenados.length];
  const endMin = parseHora(next.inicio) ?? 0;

  const ref = partesDataFabrica(referencia);
  const minutosRef = minutosNaFabrica(referencia);
  const primeiroMin = parseHora(ordenados[0].inicio) ?? 0;
  const ultimoIdx = ordenados.length - 1;

  let { ano, mes, dia } = ref;

  if (idx === ultimoIdx && minutosRef < primeiroMin) {
    const prev = diaAnteriorFabrica(ano, mes, dia);
    ano = prev.ano;
    mes = prev.mes;
    dia = prev.dia;
  }

  const inicio = instanteFromMinutos(ano, mes, dia, startMin);

  let fimAno = ano;
  let fimMes = mes;
  let fimDia = dia;
  if (endMin <= startMin) {
    const prox = diaSeguinteFabrica(ano, mes, dia);
    fimAno = prox.ano;
    fimMes = prox.mes;
    fimDia = prox.dia;
  }
  const fim = instanteFromMinutos(fimAno, fimMes, fimDia, endMin);

  return { id: turno.id, label: turno.label, inicio, fim };
}

/** Janela do turno vigente agora (horário da fábrica). */
export function janelaTurnoAtual(config: TurnosConfig, referencia = agoraFabrica()): JanelaTurno {
  const turno = classificarTurno(referencia, config);
  return janelaTurnoPorId(referencia, config, turno.id);
}

export function testeNaJanela(teste: Teste, inicio: Date, fim: Date): boolean {
  const d = dataReferenciaTeste(teste);
  return d >= inicio && d < fim;
}

export { formatarHoraFabrica as formatarHoraCurta, horaFabrica } from "./datas";
