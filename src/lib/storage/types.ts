import type { FaixaParametro, FaixasConfig, LinhasConfig, Teste, TesteBruto, TurnosConfig } from "@/lib/domain/types";

export interface StorageAdapter {
  adicionarTeste(bruto: TesteBruto): Promise<Teste>;
  listarTestes(): Promise<Teste[]>;
  limparTestes(): Promise<void>;
  lerFaixas(): Promise<FaixasConfig>;
  salvarFaixas(faixas: FaixaParametro[]): Promise<FaixasConfig>;
  resetarFaixas(): Promise<FaixasConfig>;
  lerTurnos(): Promise<TurnosConfig>;
  salvarTurnos(turnos: TurnosConfig["turnos"]): Promise<TurnosConfig>;
  resetarTurnos(): Promise<TurnosConfig>;
  lerLinhas(): Promise<LinhasConfig>;
  salvarLinhas(linhas: string[]): Promise<LinhasConfig>;
}

export function usaKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
