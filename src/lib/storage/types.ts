import type { FaixaParametro, FaixasConfig, Teste, TesteBruto } from "@/lib/domain/types";

export interface StorageAdapter {
  adicionarTeste(bruto: TesteBruto): Promise<Teste>;
  listarTestes(): Promise<Teste[]>;
  limparTestes(): Promise<void>;
  lerFaixas(): Promise<FaixasConfig>;
  salvarFaixas(faixas: FaixaParametro[]): Promise<FaixasConfig>;
  resetarFaixas(): Promise<FaixasConfig>;
}

export function usaKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
