import { kv } from "@vercel/kv";
import { PARAMETROS } from "@/lib/domain/parametros";
import { normalizarTeste } from "@/lib/domain/rules";
import { FAIXAS_PADRAO, criarFaixasConfig } from "@/lib/domain/faixasPadrao";
import { LINHAS_PADRAO, criarLinhasConfig } from "@/lib/domain/linhasPadrao";
import { TURNOS_PADRAO, criarTurnosConfig } from "@/lib/domain/turnosPadrao";
import type { FaixaParametro, FaixasConfig, LinhasConfig, Teste, TesteBruto, TurnosConfig } from "@/lib/domain/types";
import type { StorageAdapter } from "./types";

const KEY_TESTES = "dashdelta:testes";
const KEY_FAIXAS = "dashdelta:faixas";
const KEY_TURNOS = "dashdelta:turnos";
const KEY_LINHAS = "dashdelta:linhas";
const LIMITE = 2000;

function mesclarFaixas(faixas: FaixaParametro[]): FaixaParametro[] {
  const mapa = new Map(faixas.map((f) => [f.id, f]));
  return PARAMETROS.map((p) => {
    const f = mapa.get(p.id);
    return { id: p.id, min: f?.min ?? null, max: f?.max ?? null };
  });
}

export const kvStorage: StorageAdapter = {
  async adicionarTeste(bruto) {
    const faixas = (await this.lerFaixas()).faixas;
    const turnos = await this.lerTurnos();
    const teste = normalizarTeste(bruto, faixas, turnos);
    await kv.lpush(KEY_TESTES, teste);
    await kv.ltrim(KEY_TESTES, 0, LIMITE - 1);
    return teste;
  },

  async listarTestes() {
    const itens = await kv.lrange<Teste>(KEY_TESTES, 0, LIMITE - 1);
    if (!itens?.length) return [];
    return [...itens].reverse();
  },

  async limparTestes() {
    await kv.del(KEY_TESTES);
  },

  async lerFaixas() {
    const salvo = await kv.get<FaixasConfig>(KEY_FAIXAS);
    if (salvo?.faixas?.length) {
      return { ...salvo, faixas: mesclarFaixas(salvo.faixas) };
    }
    const padrao = criarFaixasConfig([...FAIXAS_PADRAO]);
    await kv.set(KEY_FAIXAS, padrao);
    return padrao;
  },

  async salvarFaixas(faixas) {
    const config: FaixasConfig = {
      faixas: mesclarFaixas(faixas),
      atualizadoEm: new Date().toISOString(),
    };
    await kv.set(KEY_FAIXAS, config);
    return config;
  },

  async resetarFaixas() {
    const config = criarFaixasConfig([...FAIXAS_PADRAO]);
    await kv.set(KEY_FAIXAS, config);
    return config;
  },

  async lerTurnos() {
    const salvo = await kv.get<TurnosConfig>(KEY_TURNOS);
    if (salvo?.turnos?.length === 3) return salvo;
    const padrao = { ...TURNOS_PADRAO, atualizadoEm: new Date().toISOString() };
    await kv.set(KEY_TURNOS, padrao);
    return padrao;
  },

  async salvarTurnos(turnos) {
    const config = criarTurnosConfig(turnos);
    await kv.set(KEY_TURNOS, config);
    return config;
  },

  async resetarTurnos() {
    const config = { ...TURNOS_PADRAO, atualizadoEm: new Date().toISOString() };
    await kv.set(KEY_TURNOS, config);
    return config;
  },

  async lerLinhas() {
    const salvo = await kv.get<LinhasConfig>(KEY_LINHAS);
    if (salvo?.linhas) return salvo;
    const padrao = { ...LINHAS_PADRAO, atualizadoEm: new Date().toISOString() };
    await kv.set(KEY_LINHAS, padrao);
    return padrao;
  },

  async salvarLinhas(linhas) {
    const config = criarLinhasConfig(linhas);
    await kv.set(KEY_LINHAS, config);
    return config;
  },
};
