import type { FaixaParametro, FaixasConfig, Teste, TesteBruto } from "./domain/types";
import { getStorage } from "./storage";

export async function adicionarTeste(bruto: TesteBruto): Promise<Teste> {
  return getStorage().adicionarTeste(bruto);
}

export async function listarTestes(): Promise<Teste[]> {
  return getStorage().listarTestes();
}

export async function limparTestes(): Promise<void> {
  return getStorage().limparTestes();
}

export async function lerFaixas(): Promise<FaixasConfig> {
  return getStorage().lerFaixas();
}

export async function salvarFaixas(faixas: FaixaParametro[]): Promise<FaixasConfig> {
  return getStorage().salvarFaixas(faixas);
}

export async function resetarFaixas(): Promise<FaixasConfig> {
  return getStorage().resetarFaixas();
}
