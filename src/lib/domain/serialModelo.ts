import type { ModeloDecodificado, SegmentoModelo } from "./types";

/** Tabelas conforme planilha Estrutura_Codigo_Ar_Condicionado.xlsx */

const DIVISAO: Record<string, string> = {
  "45": "Ar condicionado",
};

const FAMILIA: Record<string, string> = {
  H: "High wall",
  P: "Piso teto",
  O: "Outdoor (unidade externa)",
  K: "Cassete 360°",
  M: "Multi split",
};

const TIPO_MODELO: Record<string, string> = {
  V: "Eco inverter",
  W: "Eco power",
  L: "Eco logic",
  I: "Inverter",
  A: "Eco class",
  T: "Atualle eco (total inverter)",
  E: "Eco",
  U: "Universal",
  P: "Plus",
};

const VERSAO: Record<string, string> = {
  F: "Só frio",
  Q: "Quente / frio",
};

const UNIDADE: Record<string, string> = {
  I: "Interna (evaporadora)",
  E: "Externa",
  C: "Conjunto",
  P: "Painel do cassete",
};

const CAPACIDADE: Record<string, string> = {
  "00": "Sem capacidade",
  "09": "9.000 BTU/h",
  "12": "12.000 BTU/h",
  "18": "18.000 BTU/h",
  "24": "24.000 BTU/h",
  "30": "30.000 BTU/h",
  "36": "36.000 BTU/h",
  "48": "48.000 BTU/h",
  "58": "58.000 BTU/h",
  "60": "60.000 BTU/h",
  "80": "80.000 BTU/h",
};

const DIFERENCIAL: Record<string, string> = {
  A: "Gás R-22",
  B: "Gás R-410A",
};

const ALIMENTACAO: Record<string, string> = {
  "1": "127 V · 1Ø · 60 Hz",
  "2": "220 V · 1Ø · 60 Hz",
  "3": "220 V · 3Ø · 60 Hz",
  "4": "380 V · 3Ø · 60 Hz",
};

const OPCIONAL: Record<string, string> = {
  N: "Condensadora padrão",
  F: "Conjunto de filtros",
  I: "Ionizador",
  W: "Wi-Fi",
  C: "Condensador cobre",
  M: "Microcanais",
  D: "Display digital",
};

const GERACAO: Record<string, string> = {
  A: "Original",
  B: "1ª revisão",
  C: "2ª revisão",
  D: "3ª revisão",
};

function segmento(
  grupo: string,
  posicao: string,
  codigo: string,
  mapa: Record<string, string>,
): SegmentoModelo {
  const descricao = mapa[codigo];
  return {
    grupo,
    posicao,
    codigo,
    descricao: descricao ?? "Não catalogado",
    conhecido: descricao !== undefined,
  };
}

/** Decodifica o código de 12 caracteres enviado como serialModelo. */
export function decodificarSerialModelo(raw: string): ModeloDecodificado | null {
  const codigo = raw.trim().toUpperCase();
  if (!codigo) return null;

  const segmentos: SegmentoModelo[] = [
    segmento("Divisão", "1º–2º", codigo.slice(0, 2), DIVISAO),
    segmento("Família", "3º", codigo.slice(2, 3), FAMILIA),
    segmento("Tipo / modelo", "4º", codigo.slice(3, 4), TIPO_MODELO),
    segmento("Versão", "5º", codigo.slice(4, 5), VERSAO),
    segmento("Unidade", "6º", codigo.slice(5, 6), UNIDADE),
    segmento("Capacidade", "7º–8º", codigo.slice(6, 8), CAPACIDADE),
    segmento("Diferencial", "9º", codigo.slice(8, 9), DIFERENCIAL),
    segmento("Alimentação", "10º", codigo.slice(9, 10), ALIMENTACAO),
    segmento("Opcional", "11º", codigo.slice(10, 11), OPCIONAL),
    segmento("Geração", "12º", codigo.slice(11, 12), GERACAO),
  ];

  const resumo = segmentos
    .filter((s) => s.conhecido)
    .map((s) => s.descricao)
    .join(" · ");

  return {
    codigo,
    comprimentoValido: codigo.length === 12,
    segmentos,
    resumo: resumo || "—",
  };
}
