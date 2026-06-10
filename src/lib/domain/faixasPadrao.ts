import type { FaixaParametro, FaixasConfig } from "./types";

/** Faixas iniciais conforme configuração operacional CETEVA. */
export const FAIXAS_PADRAO: FaixaParametro[] = [
  { id: "ligar", min: 1, max: 1 },
  { id: "corrente", min: 1, max: 2 },
  { id: "potencia", min: 18, max: 25 },
  { id: "display", min: 1, max: 1 },
  { id: "aleta", min: 1, max: 1 },
  { id: "ruido", min: 1, max: 1 },
  { id: "fluxo", min: 2, max: 10 },
  { id: "odu", min: 1, max: 1 },
  { id: "onoff", min: 1, max: 1 },
];

export function criarFaixasConfig(faixas: FaixaParametro[] = FAIXAS_PADRAO): FaixasConfig {
  return { faixas, atualizadoEm: new Date().toISOString() };
}
