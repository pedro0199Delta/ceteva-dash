import fs from "fs";
import path from "path";
import { PARAMETROS } from "@/lib/domain/parametros";
import { normalizarTeste } from "@/lib/domain/rules";
import { FAIXAS_PADRAO, criarFaixasConfig } from "@/lib/domain/faixasPadrao";
import { LINHAS_PADRAO, criarLinhasConfig } from "@/lib/domain/linhasPadrao";
import { TURNOS_PADRAO, criarTurnosConfig } from "@/lib/domain/turnosPadrao";
import type { FaixaParametro, FaixasConfig, LinhasConfig, Teste, TesteBruto, TurnosConfig } from "@/lib/domain/types";
import type { StorageAdapter } from "./types";

const LIMITE = 2000;
const ARQUIVO_FAIXAS = path.join(process.cwd(), "data", "faixas.json");
const ARQUIVO_TURNOS = path.join(process.cwd(), "data", "turnos.json");
const ARQUIVO_LINHAS = path.join(process.cwd(), "data", "linhas.json");

interface MemState {
  testes: Teste[];
  faixas: FaixasConfig | null;
  turnos: TurnosConfig | null;
  linhas: LinhasConfig | null;
}

const g = globalThis as unknown as { __dashdeltaLocal?: MemState };

function state(): MemState {
  if (!g.__dashdeltaLocal) {
    g.__dashdeltaLocal = { testes: [], faixas: null, turnos: null, linhas: null };
  }
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

function lerJsonArquivo<T>(arquivo: string): T | null {
  try {
    if (fs.existsSync(arquivo)) {
      return JSON.parse(fs.readFileSync(arquivo, "utf-8")) as T;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function gravarJsonArquivo(arquivo: string, data: unknown): void {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(data, null, 2), "utf-8");
}

export const localStorage: StorageAdapter = {
  async adicionarTeste(bruto) {
    const faixas = (await this.lerFaixas()).faixas;
    const turnos = await this.lerTurnos();
    const teste = normalizarTeste(bruto, faixas, turnos);
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

  async lerTurnos() {
    const s = state();
    if (s.turnos) return s.turnos;
    s.turnos = lerJsonArquivo<TurnosConfig>(ARQUIVO_TURNOS) ?? {
      ...TURNOS_PADRAO,
      atualizadoEm: new Date().toISOString(),
    };
    return s.turnos;
  },

  async salvarTurnos(turnos) {
    const config = criarTurnosConfig(turnos);
    state().turnos = config;
    gravarJsonArquivo(ARQUIVO_TURNOS, config);
    return config;
  },

  async resetarTurnos() {
    const config = { ...TURNOS_PADRAO, atualizadoEm: new Date().toISOString() };
    state().turnos = config;
    gravarJsonArquivo(ARQUIVO_TURNOS, config);
    return config;
  },

  async lerLinhas() {
    const s = state();
    if (s.linhas) return s.linhas;
    s.linhas = lerJsonArquivo<LinhasConfig>(ARQUIVO_LINHAS) ?? {
      ...LINHAS_PADRAO,
      atualizadoEm: new Date().toISOString(),
    };
    return s.linhas;
  },

  async salvarLinhas(linhas) {
    const config = criarLinhasConfig(linhas);
    state().linhas = config;
    gravarJsonArquivo(ARQUIVO_LINHAS, config);
    return config;
  },
};
