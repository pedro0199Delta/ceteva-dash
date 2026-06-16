import { PARAMETROS } from "./parametros";
import { decodificarSerialModelo } from "./serialModelo";
import { classificarTurno } from "./turnos";
import { parseData, parseTempoTeste } from "./datas";
import type {
  Excecao,
  FaixaParametro,
  ParametroDef,
  ParametroLeitura,
  PontoTendencia,
  Resultado,
  Snapshot,
  StatusNivel,
  TaxaParametro,
  Teste,
  TesteBruto,
  TurnosConfig,
  YieldResumo,
} from "./types";
import {
  dataReferenciaTeste,
  formatarHoraCurta,
  janelaTurnoAtual,
  testeNaJanela,
} from "./turnos";
import { TURNOS_PADRAO } from "./turnosPadrao";

/* ----------------------------- utilidades ----------------------------- */

function normalizar(texto: string): string {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const KW_OK = ["ok", "okay", "pass", "passed", "aprovado", "aprovada", "normal", "conforme", "ativo", "sim", "true", "bom"];
const KW_ATENCAO = ["atencao", "warn", "warning", "alerta", "limite", "proximo", "near", "borderline", "monitorado"];
const KW_FALHA = ["fail", "failed", "falha", "reprovado", "reprovada", "ng", "nok", "erro", "error", "fault", "sem com", "sem comunicacao", "alto", "fora", "critico", "ausente"];

function classificarTexto(valorNorm: string): StatusNivel | null {
  if (KW_FALHA.some((k) => valorNorm.includes(k))) return "falha";
  if (KW_ATENCAO.some((k) => valorNorm.includes(k))) return "atencao";
  if (KW_OK.some((k) => valorNorm.includes(k))) return "ok";
  return null;
}

function faixaAtiva(f?: FaixaParametro): f is FaixaParametro & { min: number; max: number } {
  return !!f && f.min !== null && f.max !== null && f.min <= f.max;
}

function formatFaixaLabel(min: number, max: number, unidade?: string): string {
  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { maximumFractionDigits: 4, useGrouping: false });
  const u = unidade ? ` ${unidade}` : "";
  return `${fmt(min)} – ${fmt(max)}${u}`;
}

function classificarNumero(valor: number, min: number, max: number): StatusNivel {
  return valor >= min && valor <= max ? "ok" : "falha";
}

function lerCampo(bruto: TesteBruto, chaves: string[]): unknown {
  for (const chave of chaves) {
    if (chave in bruto && bruto[chave] !== undefined) return bruto[chave];
  }
  // tentativa tolerante: comparação normalizada das chaves
  const mapa = new Map(Object.keys(bruto).map((k) => [normalizar(k), k]));
  for (const chave of chaves) {
    const real = mapa.get(normalizar(chave));
    if (real) return bruto[real];
  }
  return undefined;
}

function parseNumero(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const limpo = raw.replace(/[^0-9,.-]/g, "").replace(",", ".");
    if (limpo === "" || limpo === "-" || limpo === ".") return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/* ----------------------- classificação de parâmetro ----------------------- */

function classificarParametro(
  def: ParametroDef,
  raw: unknown,
  faixa?: FaixaParametro,
): ParametroLeitura {
  const vazio = raw === undefined || raw === null || raw === "";
  let status: StatusNivel = "indefinido";
  let valor: number | null = null;
  let texto = "";
  let faixaLabel: string | undefined;

  if (faixaAtiva(faixa)) {
    faixaLabel = formatFaixaLabel(faixa.min, faixa.max, def.unidade);
  }

  if (!vazio) {
    valor = parseNumero(raw);

    if (faixaAtiva(faixa)) {
      if (valor !== null) {
        status = classificarNumero(valor, faixa.min, faixa.max);
        texto = `${valor}${def.unidade ? " " + def.unidade : ""}`;
      } else {
        const t = classificarTexto(normalizar(String(raw)));
        status = t ?? "falha";
        texto = String(raw);
      }
    } else if (def.numerico && valor !== null) {
      status = valor > 0 ? "ok" : "atencao";
      texto = `${valor}${def.unidade ? " " + def.unidade : ""}`;
    } else if (def.numerico) {
      const t = classificarTexto(normalizar(String(raw)));
      status = t ?? "indefinido";
      texto = String(raw);
    } else {
      const t = classificarTexto(normalizar(String(raw)));
      status = t ?? "ok";
      texto = String(raw);
    }
  } else {
    texto = "—";
  }

  return {
    id: def.id,
    label: def.label,
    unidade: def.unidade,
    critico: Boolean(def.critico),
    raw,
    valor,
    texto,
    status,
    faixaLabel,
  };
}

/** Resultado final: faixas têm prioridade sobre pass/fail do JSON. */
function derivarResultado(parametros: ParametroLeitura[], statusJson: Resultado): Resultado {
  if (parametros.some((p) => p.status === "falha")) return "reprovado";

  const preenchidos = parametros.filter((p) => p.status !== "indefinido");
  if (preenchidos.length > 0 && preenchidos.every((p) => p.status === "ok")) {
    return "aprovado";
  }

  return statusJson;
}

/* --------------------------- resultado do teste --------------------------- */

export function classificarResultado(raw: unknown): Resultado {
  if (raw === undefined || raw === null || raw === "") return "indefinido";
  if (typeof raw === "number") {
    if (raw === 0) return "aprovado";
    if (raw === 1) return "reprovado";
  }
  const v = normalizar(String(raw));
  if (["0", "pass", "passed", "aprovado", "aprovada", "ok", "approved"].includes(v)) return "aprovado";
  if (["1", "fail", "failed", "reprovado", "reprovada", "nok", "ng", "reproved"].includes(v)) return "reprovado";
  if (["running", "em teste", "em_teste", "test", "testing", "executando"].includes(v)) return "em_teste";
  if (v.includes("aprov")) return "aprovado";
  if (v.includes("reprov") || v.includes("fail")) return "reprovado";
  return "indefinido";
}

export { parseData, parseTempoTeste } from "./datas";

let contador = 0;

export function normalizarTeste(
  bruto: TesteBruto,
  faixas: FaixaParametro[] = [],
  turnos: TurnosConfig = TURNOS_PADRAO,
): Teste {
  const mapaFaixas = new Map(faixas.map((f) => [f.id, f]));
  const serial = String(lerCampo(bruto, ["serial", "Serial", "NroSerie", "numeroSerie"]) ?? "").trim();
  const serialModelo = String(
    lerCampo(bruto, ["serialModelo", "SerialModelo", "serial_modelo", "inicioSerialModel"]) ?? "",
  ).trim();
  const modeloLegado = String(lerCampo(bruto, ["modelo", "Modelo", "model"]) ?? "").trim();
  const modeloDecodificado = serialModelo ? decodificarSerialModelo(serialModelo) : null;
  const modelo = modeloLegado || modeloDecodificado?.resumo || serialModelo;
  const linha = String(
    lerCampo(bruto, ["linha", "Linha", "linhaProducao", "linha_producao"]) ?? "",
  ).trim();
  const ipCeteva = String(lerCampo(bruto, ["ipCeteva", "IP", "ip", "ceteva", "IP CETEVA"]) ?? "").trim();
  const idMachine = String(
    lerCampo(bruto, ["id_machine", "idMachine", "IdMachine", "modulo", "Modulo", "machine"]) ?? "",
  ).trim();
  const operador = String(lerCampo(bruto, ["operador", "Operador", "operator"]) ?? "").trim();
  const dthInicio = String(lerCampo(bruto, ["dthInicio", "dataInicio", "inicio"]) ?? "").trim();
  const dthGeraLog = String(lerCampo(bruto, ["dthGeraLog", "dataLog", "dthFim", "fim"]) ?? "").trim();

  const statusJson = classificarResultado(
    lerCampo(bruto, ["status", "Status", "resultado", "codigo", "Codigo"]),
  );

  const parametros = PARAMETROS.map((def) =>
    classificarParametro(def, lerCampo(bruto, def.jsonKeys), mapaFaixas.get(def.id)),
  );

  const resultado = derivarResultado(parametros, statusJson);

  const tempoTesteRaw = lerCampo(bruto, [
    "tempo_teste",
    "tempoTeste",
    "tempo do teste",
    "duracao",
    "duracaoSeg",
  ]);
  const tempoTesteSeg = parseTempoTeste(tempoTesteRaw);

  const inicio = parseData(dthInicio);
  const fim = parseData(dthGeraLog);
  const duracaoPorDatas =
    inicio && fim ? Math.max(0, Math.round((fim.getTime() - inicio.getTime()) / 1000)) : null;
  const duracaoSeg = tempoTesteSeg ?? duracaoPorDatas;

  const refLog = parseData(dthGeraLog);
  const turnoInfo = refLog ? classificarTurno(refLog, turnos) : null;

  contador += 1;
  const id = `${Date.now().toString(36)}-${contador.toString(36)}`;

  return {
    id,
    serial,
    serialModelo,
    modeloDecodificado,
    modelo,
    linha,
    turno: turnoInfo?.id ?? null,
    turnoLabel: turnoInfo?.label ?? "",
    ipCeteva,
    idMachine,
    operador,
    dthInicio,
    dthGeraLog,
    recebidoEm: new Date().toISOString(),
    resultado,
    parametros,
    duracaoSeg,
  };
}

/* ------------------------------ derivações UI ------------------------------ */

/** Pior nível de status entre os parâmetros (para destaque de card). */
export function piorStatus(teste: Teste): StatusNivel {
  if (teste.parametros.some((p) => p.status === "falha")) return "falha";
  if (teste.parametros.some((p) => p.status === "atencao")) return "atencao";
  if (teste.parametros.some((p) => p.status === "ok")) return "ok";
  return "indefinido";
}

/** Indicador crítico principal (maior desvio) para o card de alerta. */
export function indicadorCritico(teste: Teste): ParametroLeitura | null {
  const criticos = teste.parametros.filter((p) => p.critico);
  return (
    criticos.find((p) => p.status === "falha") ??
    teste.parametros.find((p) => p.status === "falha") ??
    criticos.find((p) => p.status === "atencao") ??
    teste.parametros.find((p) => p.status === "atencao") ??
    null
  );
}

const TITULOS_FALHA: Record<string, string> = {
  odu: "ODU sem comunicação",
  ruido: "Ruído fora da faixa",
  potencia: "Potência fora da faixa",
  corrente: "Corrente fora da faixa",
  fluxo: "Fluxo fora da faixa",
  ligar: "Ligar dispositivo fora da faixa",
  display: "Display fora da faixa",
  aleta: "Aleta fora da faixa",
  onoff: "On/Off fora da faixa",
};
const TITULOS_ATENCAO: Record<string, string> = {
  odu: "ODU em atenção",
  ruido: "Ruído próximo do limite",
  potencia: "Potência próxima do limite",
  corrente: "Corrente próxima do limite",
  fluxo: "Fluxo próximo do limite",
};

/* ------------------------------ agregações --------------------------------- */

export interface OpcoesSnapshot {
  linhaFiltro?: string;
  turnos?: TurnosConfig;
}

function filtrarPorLinha(testes: Teste[], linhaFiltro?: string): Teste[] {
  const f = linhaFiltro?.trim();
  if (!f) return testes;
  return testes.filter((t) => t.linha === f);
}

function calcularYield(lista: Teste[]): YieldResumo {
  const aprovados = lista.filter((t) => t.resultado === "aprovado").length;
  const reprovados = lista.filter((t) => t.resultado === "reprovado").length;
  const totalResult = aprovados + reprovados;
  const taxa = totalResult > 0 ? (aprovados / totalResult) * 100 : 0;
  return { aprovados, reprovados, taxa: Math.round(taxa * 10) / 10 };
}

function montarTendenciaTurno(ordenados: Teste[], inicio: Date, fim: Date): PontoTendencia[] {
  const pontos: PontoTendencia[] = [];
  let cursor = new Date(inicio);
  while (cursor < fim) {
    const slotFim = new Date(cursor);
    slotFim.setHours(cursor.getHours() + 1, 0, 0, 0);
    const fimSlot = slotFim < fim ? slotFim : fim;
    const naFaixa = ordenados.filter((t) => {
      const d = dataReferenciaTeste(t);
      return d >= cursor && d < fimSlot;
    });
    pontos.push({
      hora: `${String(cursor.getHours()).padStart(2, "0")}h`,
      desvios: naFaixa.filter((t) => t.resultado === "reprovado").length,
      total: naFaixa.length,
    });
    cursor = fimSlot;
  }
  return pontos.length ? pontos : [{ hora: "—", desvios: 0, total: 0 }];
}

export function montarSnapshot(testes: Teste[], opcoes: OpcoesSnapshot = {}): Snapshot {
  const turnos = opcoes.turnos ?? TURNOS_PADRAO;
  const linhaFiltro = opcoes.linhaFiltro?.trim() ?? "";
  const agora = new Date();
  const janela = janelaTurnoAtual(agora, turnos);

  const porLinha = filtrarPorLinha(testes, linhaFiltro || undefined);
  const ordenados = [...porLinha].sort(
    (a, b) => new Date(b.recebidoEm).getTime() - new Date(a.recebidoEm).getTime(),
  );
  const noTurno = ordenados.filter((t) => testeNaJanela(t, janela.inicio, janela.fim));
  const atual = ordenados[0] ?? null;

  const yieldTurno = calcularYield(noTurno);

  const duracoes = noTurno.map((t) => t.duracaoSeg).filter((d): d is number => d !== null && d > 0);
  const tempoMedioSeg = duracoes.length
    ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
    : null;

  const tendencia = montarTendenciaTurno(noTurno, janela.inicio, janela.fim);

  const taxaPorParametro: TaxaParametro[] = PARAMETROS.map((def) => {
    const leituras = noTurno
      .map((t) => t.parametros.find((p) => p.id === def.id))
      .filter((p): p is NonNullable<typeof p> => !!p && p.status !== "indefinido");
    const ok = leituras.filter((p) => p.status === "ok").length;
    return {
      id: def.id,
      label: def.label,
      amostras: leituras.length,
      taxaOk: leituras.length ? Math.round((ok / leituras.length) * 100) : 0,
    };
  });

  const excecoes = montarExcecoes(atual, noTurno);

  return {
    atual,
    totalTestes: noTurno.length,
    yieldTurno,
    yield24h: yieldTurno,
    turnoAtual: {
      id: janela.id,
      label: janela.label,
      inicio: formatarHoraCurta(janela.inicio),
      fim: formatarHoraCurta(janela.fim),
    },
    linhaFiltro,
    tempoMedioSeg,
    tendencia,
    taxaPorParametro,
    excecoes,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

function tituloExcecao(base: string, teste: Teste | null): string {
  const modulo = teste?.idMachine?.trim();
  return modulo ? `${modulo} — ${base}` : base;
}

function montarExcecoes(atual: Teste | null, ordenados: Teste[]): Excecao[] {
  const lista: Excecao[] = [];
  if (atual) {
    for (const p of atual.parametros) {
      if (p.status === "falha") {
        const base = TITULOS_FALHA[p.id] ?? `${p.label} em falha`;
        lista.push({
          nivel: "falha",
          tipo: p.id,
          titulo: tituloExcecao(base, atual),
        });
      }
    }
    for (const p of atual.parametros) {
      if (p.status === "atencao") {
        const base = TITULOS_ATENCAO[p.id] ?? `${p.label} em atenção`;
        lista.push({
          nivel: "atencao",
          tipo: p.id,
          titulo: tituloExcecao(base, atual),
        });
      }
    }
  }

  // Sequência de reprovações
  let seq = 0;
  for (const t of ordenados) {
    if (t.resultado === "reprovado") seq++;
    else break;
  }
  if (seq >= 3) {
    lista.unshift({
      nivel: "falha",
      tipo: "sequencia",
      titulo: tituloExcecao(`Sequência de ${seq} reprovações`, atual),
    });
  }

  return lista.slice(0, 8);
}
