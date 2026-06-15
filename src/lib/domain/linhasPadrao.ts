import type { LinhasConfig } from "./types";

export const LINHAS_PADRAO: LinhasConfig = {
  linhas: [],
  atualizadoEm: new Date(0).toISOString(),
};

export function criarLinhasConfig(linhas: string[]): LinhasConfig {
  const unicas = [...new Set(linhas.map((l) => l.trim()).filter(Boolean))];
  return {
    linhas: unicas,
    atualizadoEm: new Date().toISOString(),
  };
}
