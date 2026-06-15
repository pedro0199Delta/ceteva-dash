// Tipos de domínio do DashDelta (CETEVA)

export type StatusNivel = "ok" | "atencao" | "falha" | "indefinido";

export type Resultado = "aprovado" | "reprovado" | "em_teste" | "indefinido";

/** Definição (catálogo) de um parâmetro de teste. */
export interface ParametroDef {
  id: string;
  label: string;
  /** Possíveis chaves no JSON recebido (tolerante a variações). */
  jsonKeys: string[];
  unidade?: string;
  numerico?: boolean;
  /** Parâmetro crítico: gera exceção prioritária quando em falha. */
  critico?: boolean;
  /** Faixas opcionais para classificação de valores numéricos. */
  faixa?: {
    okMin?: number;
    okMax?: number;
    atencaoMin?: number;
    atencaoMax?: number;
  };
}

/** Leitura de um parâmetro já normalizada/classificada. */
export interface ParametroLeitura {
  id: string;
  label: string;
  unidade?: string;
  critico: boolean;
  raw: unknown;
  valor: number | null;
  texto: string;
  status: StatusNivel;
  /** Faixa configurada ex.: "0,3 – 0,5 A" */
  faixaLabel?: string;
}

/** Faixa min/máx configurável por parâmetro. */
export interface FaixaParametro {
  id: string;
  min: number | null;
  max: number | null;
}

export interface FaixasConfig {
  faixas: FaixaParametro[];
  atualizadoEm: string;
}

export interface TurnoDef {
  id: 1 | 2 | 3;
  label: string;
  /** Horário de início (HH:mm). */
  inicio: string;
}

export interface TurnosConfig {
  turnos: TurnoDef[];
  atualizadoEm: string;
}

export interface LinhasConfig {
  linhas: string[];
  atualizadoEm: string;
}

export interface TurnoAtualInfo {
  id: 1 | 2 | 3;
  label: string;
  inicio: string;
  fim: string;
}

export interface YieldResumo {
  aprovados: number;
  reprovados: number;
  taxa: number;
}

/** Payload bruto recebido do app externo (chaves livres). */
export type TesteBruto = Record<string, unknown>;

/** Um segmento do código serialModelo (12 caracteres). */
export interface SegmentoModelo {
  grupo: string;
  posicao: string;
  codigo: string;
  descricao: string;
  conhecido: boolean;
}

/** Decodificação do código de modelo CETEVA. */
export interface ModeloDecodificado {
  codigo: string;
  comprimentoValido: boolean;
  segmentos: SegmentoModelo[];
  resumo: string;
}

/** Teste normalizado, pronto para a UI. */
export interface Teste {
  id: string;
  serial: string;
  /** Código de 12 caracteres (ex.: 45HJFI12C2WG). */
  serialModelo: string;
  modeloDecodificado: ModeloDecodificado | null;
  modelo: string;
  linha: string;
  turno: 1 | 2 | 3 | null;
  turnoLabel: string;
  ipCeteva: string;
  operador: string;
  dthInicio: string;
  dthGeraLog: string;
  recebidoEm: string; // ISO
  resultado: Resultado;
  parametros: ParametroLeitura[];
  duracaoSeg: number | null;
}

export interface Excecao {
  nivel: "falha" | "atencao";
  tipo: string;
  titulo: string;
}

export interface PontoTendencia {
  hora: string;
  desvios: number;
  total: number;
}

export interface TaxaParametro {
  id: string;
  label: string;
  taxaOk: number; // 0..100
  amostras: number;
}

export interface Snapshot {
  atual: Teste | null;
  totalTestes: number;
  /** Métricas do turno vigente (zeram ao mudar o turno). */
  yieldTurno: YieldResumo;
  turnoAtual: TurnoAtualInfo | null;
  linhaFiltro: string;
  tempoMedioSeg: number | null;
  tendencia: PontoTendencia[];
  taxaPorParametro: TaxaParametro[];
  excecoes: Excecao[];
  ultimaAtualizacao: string;
  /** @deprecated Use yieldTurno — mantido por compatibilidade. */
  yield24h: YieldResumo;
}
