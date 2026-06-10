import fs from "fs";
import path from "path";
import { PARAMETROS } from "@/lib/domain/parametros";
import { normalizarTeste } from "@/lib/domain/rules";
import { FAIXAS_PADRAO, criarFaixasConfig } from "@/lib/domain/faixasPadrao";
import type { FaixaParametro, FaixasConfig, Teste, TesteBruto } from "@/lib/domain/types";
import type { StorageAdapter } from "./types";

const LIMITE = 2000;
const ARQUIVO_FAIXAS = path.join(process.cwd(), "data", "faixas.json");

interface MemState {
  testes: Teste[];
  faixas: FaixasConfig | null;
}

const g = globalThis as unknown as { __dashdeltaLocal?: MemState };

function state(): MemState {
  if (!g.__dashdeltaLocal) g.__dashdeltaLocal = { testes: [], faixas: null };
  return g.__dashdeltaLocal;
}

function mesclarFaixas(faixas: FaixaParametro[]): FaixaParametro[] {
  const mapa = new Map(faixas.map((f) => [f.id, f]));
  return PARAMETROS.map((p) => {
    const f = mapa.get(p.id);
    return { id: p.id, min: f?.min ?? null, max: f?.max ?? null };
  });
}

function lerFaixasArquivo(): FaixasConfig | null {
  try {
    if (fs.existsSync(ARQUIVO_FAIXAS)) {
      const raw = JSON.parse(fs.readFileSync(ARQUIVO_FAIXAS, "utf-8")) as FaixasConfig;
      return { ...raw, faixas: mesclarFaixas(raw.faixas) };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function gravarFaixasArquivo(config: FaixasConfig): void {
  fs.mkdirSync(path.dirname(ARQUIVO_FAIXAS), { recursive: true });
  fs.writeFileSync(ARQUIVO_FAIXAS, JSON.stringify(config, null, 2), "utf-8");
}

export const localStorage: StorageAdapter = {
  async adicionarTeste(bruto) {
    const faixas = (await this.lerFaixas()).faixas;
    const teste = normalizarTeste(bruto, faixas);
    const s = state();
    s.testes.push(teste);
    if (s.testes.length > LIMITE) s.testes.splice(0, s.testes.length - LIMITE);
    return teste;
  },

  async listarTestes() {
    return state().testes;
  },

  async limparTestes() {
    state().testes = [];
  },

  async lerFaixas() {
    const s = state();
    if (s.faixas) return s.faixas;
    s.faixas = lerFaixasArquivo() ?? criarFaixasConfig([...FAIXAS_PADRAO]);
    return s.faixas;
  },

  async salvarFaixas(faixas) {
    const config: FaixasConfig = {
      faixas: mesclarFaixas(faixas),
      atualizadoEm: new Date().toISOString(),
    };
    state().faixas = config;
    gravarFaixasArquivo(config);
    return config;
  },

  async resetarFaixas() {
    const config = criarFaixasConfig([...FAIXAS_PADRAO]);
    state().faixas = config;
    gravarFaixasArquivo(config);
    return config;
  },
};
