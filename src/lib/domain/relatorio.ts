import { parseData } from "./datas";
import { instanteFabrica } from "./fusoFabrica";
import {
  dataReferenciaTeste,
  janelaTurnoPorId,
  testeNaJanela,
} from "./turnos";
import type { Teste, TurnosConfig } from "./types";

/** Categorias na ordem do relatório operacional. */
export const CATEGORIAS_RELATORIO: { id: string; label: string }[] = [
  { id: "ligar", label: "Ligar" },
  { id: "onoff", label: "Botão" },
  { id: "display", label: "Display" },
  { id: "aleta", label: "Aleta" },
  { id: "ruido", label: "Ruído" },
  { id: "corrente", label: "Corrente" },
  { id: "potencia", label: "Potência" },
  { id: "fluxo", label: "Fluxo" },
  { id: "odu", label: "Comunicação" },
];

export interface RelatorioResumo {
  total: number;
  aprovados: number;
  reprovados: number;
  taxa: number;
}

export interface RelatorioMaquina {
  id: string;
  label: string;
  testados: number;
  aprovados: number;
  reprovados: number;
  taxa: number;
  participacaoFalhas: number;
}

export interface RelatorioCategoriaFalha {
  id: string;
  label: string;
  porMaquina: Record<string, number>;
  total: number;
  percentualFalhas: number;
}

export interface RelatorioPeriodo {
  descricao: string;
  inicio: string;
  fim: string;
}

export interface RelatorioData {
  periodo: RelatorioPeriodo;
  resumo: RelatorioResumo;
  maquinas: RelatorioMaquina[];
  categoriasFalha: RelatorioCategoriaFalha[];
  maquinaIds: string[];
}

export type FiltroRelatorio =
  | { tipo: "turno"; data: string; turno: 1 | 2 | 3; linha?: string }
  | { tipo: "periodo"; inicio: string; fim: string; linha?: string };

function parseDataHora(texto: string, fimDoDia = false): Date | null {
  const t = texto.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [yyyy, MM, dd] = t.split("-").map(Number);
    return instanteFabrica(yyyy, MM, dd, fimDoDia ? 23 : 0, fimDoDia ? 59 : 0, fimDoDia ? 59 : 0);
  }
  return parseData(t);
}

function labelMaquina(id: string): string {
  if (!id || id === "—") return "Sem máquina";
  return id;
}

function ordenarMaquinas(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const na = a.match(/\d+/)?.[0];
    const nb = b.match(/\d+/)?.[0];
    if (na && nb) return Number(na) - Number(nb);
    return a.localeCompare(b, "pt-BR");
  });
}

function filtrarTestes(testes: Teste[], filtro: FiltroRelatorio, turnos: TurnosConfig): Teste[] {
  let lista = testes;

  if (filtro.linha?.trim()) {
    lista = lista.filter((t) => t.linha === filtro.linha!.trim());
  }

  if (filtro.tipo === "turno") {
    const [yyyy, MM, dd] = filtro.data.split("-").map(Number);
    const ref = instanteFabrica(yyyy, MM, dd, 12, 0);
    const janela = janelaTurnoPorId(ref, turnos, filtro.turno);
    return lista.filter((t) => testeNaJanela(t, janela.inicio, janela.fim));
  }

  const inicio = parseDataHora(filtro.inicio);
  const fimRaw = parseDataHora(filtro.fim, true);
  if (!inicio || !fimRaw) return [];

  const fim = filtro.fim.trim().length <= 10
    ? new Date(fimRaw.getTime() + 1000)
    : fimRaw;

  return lista.filter((t) => {
    const d = dataReferenciaTeste(t);
    return d >= inicio && d <= fim;
  });
}

function descricaoPeriodo(filtro: FiltroRelatorio, turnos: TurnosConfig): RelatorioPeriodo {
  if (filtro.tipo === "turno") {
    const [yyyy, MM, dd] = filtro.data.split("-").map(Number);
    const ref = instanteFabrica(yyyy, MM, dd, 12, 0);
    const janela = janelaTurnoPorId(ref, turnos, filtro.turno);
    const turno = turnos.turnos.find((t) => t.id === filtro.turno);
    return {
      descricao: `${turno?.label ?? filtro.turno + "º turno"} · ${filtro.data.split("-").reverse().join("/")}`,
      inicio: janela.inicio.toISOString(),
      fim: janela.fim.toISOString(),
    };
  }

  const fmt = (s: string) => {
    const d = parseDataHora(s) ?? parseDataHora(s, true);
    return d
      ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : s;
  };

  return {
    descricao: `${fmt(filtro.inicio)} até ${fmt(filtro.fim)}`,
    inicio: (parseDataHora(filtro.inicio) ?? new Date()).toISOString(),
    fim: (parseDataHora(filtro.fim, true) ?? new Date()).toISOString(),
  };
}

export function montarRelatorio(
  testes: Teste[],
  filtro: FiltroRelatorio,
  turnos: TurnosConfig,
): RelatorioData {
  const filtrados = filtrarTestes(testes, filtro, turnos);
  const comResultado = filtrados.filter(
    (t) => t.resultado === "aprovado" || t.resultado === "reprovado",
  );

  const aprovados = comResultado.filter((t) => t.resultado === "aprovado").length;
  const reprovados = comResultado.filter((t) => t.resultado === "reprovado").length;
  const total = comResultado.length;
  const taxa = total > 0 ? Math.round((aprovados / total) * 1000) / 10 : 0;

  const maquinaIds = ordenarMaquinas([
    ...new Set(comResultado.map((t) => t.idMachine?.trim() || "—")),
  ]);

  const maquinas: RelatorioMaquina[] = maquinaIds.map((id) => {
    const doId = comResultado.filter((t) => (t.idMachine?.trim() || "—") === id);
    const ap = doId.filter((t) => t.resultado === "aprovado").length;
    const rep = doId.filter((t) => t.resultado === "reprovado").length;
    const tot = doId.length;
    return {
      id,
      label: labelMaquina(id),
      testados: tot,
      aprovados: ap,
      reprovados: rep,
      taxa: tot > 0 ? Math.round((ap / tot) * 1000) / 10 : 0,
      participacaoFalhas: reprovados > 0 ? Math.round((rep / reprovados) * 1000) / 10 : 0,
    };
  });

  let totalFalhasParam = 0;
  const contagem: Record<string, Record<string, number>> = {};

  for (const cat of CATEGORIAS_RELATORIO) {
    contagem[cat.id] = Object.fromEntries(maquinaIds.map((m) => [m, 0]));
  }

  for (const teste of comResultado) {
    const mid = teste.idMachine?.trim() || "—";
    for (const cat of CATEGORIAS_RELATORIO) {
      const p = teste.parametros.find((x) => x.id === cat.id);
      if (p?.status === "falha") {
        contagem[cat.id][mid] = (contagem[cat.id][mid] ?? 0) + 1;
        totalFalhasParam += 1;
      }
    }
  }

  const categoriasFalha: RelatorioCategoriaFalha[] = CATEGORIAS_RELATORIO.map((cat) => {
    const porMaquina = contagem[cat.id];
    const tot = Object.values(porMaquina).reduce((a, b) => a + b, 0);
    return {
      id: cat.id,
      label: cat.label,
      porMaquina,
      total: tot,
      percentualFalhas:
        totalFalhasParam > 0 ? Math.round((tot / totalFalhasParam) * 1000) / 10 : 0,
    };
  });

  return {
    periodo: descricaoPeriodo(filtro, turnos),
    resumo: { total, aprovados, reprovados, taxa },
    maquinas,
    categoriasFalha,
    maquinaIds,
  };
}
