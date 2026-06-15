import type { TurnosConfig } from "./types";

export const TURNOS_PADRAO: TurnosConfig = {
  turnos: [
    { id: 1, label: "1º turno", inicio: "06:00" },
    { id: 2, label: "2º turno", inicio: "14:00" },
    { id: 3, label: "3º turno", inicio: "22:00" },
  ],
  atualizadoEm: new Date(0).toISOString(),
};

export function criarTurnosConfig(
  turnos: TurnosConfig["turnos"],
): TurnosConfig {
  return {
    turnos,
    atualizadoEm: new Date().toISOString(),
  };
}
