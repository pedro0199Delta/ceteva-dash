import { PARAMETROS } from "./parametros";
import { decodificarSerialModelo } from "./serialModelo";
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
} from "./types";

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

/* ------------------------------ parse de datas ----------------------------- */

/** Aceita "dd/MM/yyyy HH:mm:ss" e "yyyy-MM-dd HH:mm:ss". */
export function parseData(texto: string | undefined): Date | null {
  if (!texto) return null;
  const t = texto.trim();
  let m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, dd, MM, yyyy, hh, mi, ss] = m;
    return new Date(+yyyy, +MM - 1, +dd, +hh, +mi, +ss);
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, yyyy, MM, dd, hh, mi, ss] = m;
    return new Date(+yyyy, +MM - 1, +dd, +hh, +mi, +ss);
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Aceita "HH:mm:ss" ou "mm:ss" (campo tempo_teste enviado pelo CETEVA). */
export function parseTempoTeste(texto: unknown): number | null {
  if (texto === undefined || texto === null) return null;
  const t = String(texto).trim();
  if (!t) return null;

  let m = t.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, hh, mi, ss] = m;
    return +hh * 3600 + +mi * 60 + +ss;
  }
  m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const [, mi, ss] = m;
    return +mi * 60 + +ss;
  }
  return null;
}

/* --------------------------- normalização principal ------------------------ */

let contador = 0;

export function normalizarTeste(bruto: TesteBruto, faixas: FaixaParametro[] = []): Teste {
  const mapaFaixas = new Map(faixas.map((f) => [f.id, f]));
  const serial = String(lerCampo(bruto, ["serial", "Serial", "NroSerie", "numeroSerie"]) ?? "").trim();
  const serialModelo = String(
    lerCampo(bruto, ["serialModelo", "SerialModelo", "serial_modelo", "inicioSerialModel"]) ?? "",
  ).trim();
  const modeloLegado = String(lerCampo(bruto, ["modelo", "Modelo", "model"]) ?? "").trim();
  const modeloDecodificado = serialModelo ? decodificarSerialModelo(serialModelo) : null;
  const modelo = modeloLegado || modeloDecodificado?.resumo || serialModelo;
  const linha = String(lerCampo(bruto, ["linha", "Linha", "linhaProducao"]) ?? "").trim();
  const ipCeteva = String(lerCampo(bruto, ["ipCeteva", "IP", "ip", "ceteva", "IP CETEVA"]) ?? "").trim();
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

  contador += 1;
  const id = `${Date.now().toString(36)}-${contador.toString(36)}`;

  return {
    id,
    serial,
    serialModelo,
    modeloDecodificado,
    modelo,
    linha,
    ipCeteva,
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

export function montarSnapshot(testes: Teste[]): Snapshot {
  const ordenados = [...testes].sort(
    (a, b) => new Date(b.recebidoEm).getTime() - new Date(a.recebidoEm).getTime(),
  );
  const atual = ordenados[0] ?? null;
  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  const ultimas24h = ordenados.filter((t) => agora - new Date(t.recebidoEm).getTime() <= dia);

  const aprovados = ultimas24h.filter((t) => t.resultado === "aprovado").length;
  const reprovados = ultimas24h.filter((t) => t.resultado === "reprovado").length;
  const totalResult = aprovados + reprovados;
  const taxa = totalResult > 0 ? (aprovados / totalResult) * 100 : 0;

  const duracoes = ultimas24h.map((t) => t.duracaoSeg).filter((d): d is number => d !== null && d > 0);
  const tempoMedioSeg = duracoes.length
    ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
    : null;

  // Tendência de desvio por hora (últimas 12 horas)
  const tendencia: PontoTendencia[] = [];
  for (let i = 11; i >= 0; i--) {
    const ref = new Date(agora - i * 60 * 60 * 1000);
    const hora = ref.getHours();
    const naFaixa = ordenados.filter((t) => {
      const d = new Date(t.recebidoEm);
      return d.getHours() === hora && agora - d.getTime() <= 12 * 60 * 60 * 1000;
    });
    tendencia.push({
      hora: `${String(hora).padStart(2, "0")}h`,
      desvios: naFaixa.filter((t) => t.resultado === "reprovado").length,
      total: naFaixa.length,
    });
  }

  // Taxa de aprovação por parâmetro
  const taxaPorParametro: TaxaParametro[] = PARAMETROS.map((def) => {
    const leituras = ordenados
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

  const excecoes = montarExcecoes(atual, ordenados);

  return {
    atual,
    totalTestes: testes.length,
    yield24h: { aprovados, reprovados, taxa: Math.round(taxa * 10) / 10 },
    tempoMedioSeg,
    tendencia,
    taxaPorParametro,
    excecoes,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

function montarExcecoes(atual: Teste | null, ordenados: Teste[]): Excecao[] {
  const lista: Excecao[] = [];
  if (atual) {
    for (const p of atual.parametros) {
      if (p.status === "falha") {
        lista.push({
          nivel: "falha",
          tipo: p.id,
          titulo: TITULOS_FALHA[p.id] ?? `${p.label} em falha`,
        });
      }
    }
    for (const p of atual.parametros) {
      if (p.status === "atencao") {
        lista.push({
          nivel: "atencao",
          tipo: p.id,
          titulo: TITULOS_ATENCAO[p.id] ?? `${p.label} em atenção`,
        });
      }
    }
    if (!atual.operador) {
      lista.push({ nivel: "atencao", tipo: "operador", titulo: "Operador não informado" });
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
      titulo: `Sequência de ${seq} reprovações`,
    });
  }

  return lista.slice(0, 8);
}
