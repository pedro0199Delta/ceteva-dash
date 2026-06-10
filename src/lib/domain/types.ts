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

/** Payload bruto recebido do app externo (chaves livres). */
export type TesteBruto = Record<string, unknown>;

/** Teste normalizado, pronto para a UI. */
export interface Teste {
  id: string;
  serial: string;
  modelo: string;
  linha: string;
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
  yield24h: { aprovados: number; reprovados: number; taxa: number };
  tempoMedioSeg: number | null;
  tendencia: PontoTendencia[];
  taxaPorParametro: TaxaParametro[];
  excecoes: Excecao[];
  ultimaAtualizacao: string;
}
