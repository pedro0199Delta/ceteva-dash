import type { FaixaParametro, FaixasConfig, LinhasConfig, Teste, TesteBruto, TurnosConfig } from "./domain/types";
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

export async function lerTurnos(): Promise<TurnosConfig> {
  return getStorage().lerTurnos();
}

export async function salvarTurnos(turnos: TurnosConfig["turnos"]): Promise<TurnosConfig> {
  return getStorage().salvarTurnos(turnos);
}

export async function resetarTurnos(): Promise<TurnosConfig> {
  return getStorage().resetarTurnos();
}

export async function lerLinhas(): Promise<LinhasConfig> {
  return getStorage().lerLinhas();
}

export async function salvarLinhas(linhas: string[]): Promise<LinhasConfig> {
  return getStorage().salvarLinhas(linhas);
}
