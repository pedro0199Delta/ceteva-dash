import type { ParametroDef, ParametroLeitura } from "./types";

/**
 * Catálogo de parâmetros conforme briefing.
 * A ordem aqui define a ordem padrão de exibição no painel de parâmetros.
 */
export const PARAMETROS: ParametroDef[] = [
  {
    id: "ligar",
    label: "Ligar dispositivo",
    jsonKeys: ["Ligar Dispositivo", "Ligar dispositivo", "ligar"],
    numerico: true,
  },
  {
    id: "corrente",
    label: "Corrente",
    jsonKeys: ["Corrente (A)", "Corrente", "corrente"],
    unidade: "A",
    numerico: true,
  },
  {
    id: "potencia",
    label: "Potência",
    jsonKeys: ["Potencia (W)", "Potência (W)", "Potencia", "potencia"],
    unidade: "W",
    numerico: true,
    critico: true,
  },
  {
    id: "display",
    label: "Display",
    jsonKeys: ["Display", "display"],
    numerico: true,
  },
  {
    id: "aleta",
    label: "Aleta",
    jsonKeys: ["Abertura Aleta", "Aleta", "aleta"],
    numerico: true,
  },
  {
    id: "ruido",
    label: "Ruído",
    jsonKeys: ["Ruido", "Ruído", "ruido"],
    numerico: true,
    critico: true,
  },
  {
    id: "fluxo",
    label: "Fluxo",
    jsonKeys: ["Fluxo", "fluxo"],
    numerico: true,
  },
  {
    id: "odu",
    label: "ODU",
    jsonKeys: ["Comunicacao ODU", "Comunicação ODU", "ODU", "odu"],
    numerico: true,
    critico: true,
  },
  {
    id: "onoff",
    label: "On/Off",
    jsonKeys: ["Botao ON/OFF", "Botão ON/OFF", "On/Off", "onoff"],
    numerico: true,
  },
];

/** Parâmetros exibidos na faixa de semáforo do painel (inclui corrente e potência). */
export const SEMAFORO_OPERADOR = [
  "corrente",
  "potencia",
  "display",
  "aleta",
  "ruido",
  "fluxo",
  "odu",
  "onoff",
];

export function getParametro(id: string): ParametroDef | undefined {
  return PARAMETROS.find((p) => p.id === id);
}

/** Leituras vazias para exibir a dashboard sem teste recebido. */
export function parametrosVazios(): ParametroLeitura[] {
  return PARAMETROS.map((def) => ({
    id: def.id,
    label: def.label,
    unidade: def.unidade,
    critico: Boolean(def.critico),
    raw: null,
    valor: null,
    texto: "—",
    status: "indefinido" as const,
  }));
}
