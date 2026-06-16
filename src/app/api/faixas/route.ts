import { NextResponse } from "next/server";
import { PARAMETROS } from "@/lib/domain/parametros";
import type { FaixaParametro } from "@/lib/domain/types";
import { lerFaixas, resetarFaixas, salvarFaixas } from "@/lib/store";
import { corsHeaders, jsonCors, optionsCors } from "@/lib/api/cors";
import { exigirConfigAuth } from "@/lib/api/exigirConfigAuth";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsCors();
}

export async function GET() {
  const negado = await exigirConfigAuth();
  if (negado) return negado;
  const config = await lerFaixas();
  const labels = Object.fromEntries(PARAMETROS.map((p) => [p.id, p.label]));
  return jsonCors({ ...config, labels });
}

export async function PUT(req: Request) {
  const negado = await exigirConfigAuth();
  if (negado) return negado;
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return jsonCors({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  const lista = (corpo as { faixas?: FaixaParametro[] }).faixas;
  if (!Array.isArray(lista)) {
    return jsonCors({ ok: false, erro: "Campo 'faixas' obrigatório" }, { status: 400 });
  }

  const idsValidos = new Set(PARAMETROS.map((p) => p.id));
  const normalizadas: FaixaParametro[] = [];

  for (const item of lista) {
    if (!item || typeof item !== "object" || !idsValidos.has(item.id)) continue;
    const raw = item as { id: string; min: unknown; max: unknown };
    const min =
      raw.min === null || raw.min === undefined || raw.min === "" ? null : Number(raw.min);
    const max =
      raw.max === null || raw.max === undefined || raw.max === "" ? null : Number(raw.max);
    if (min !== null && !Number.isFinite(min)) {
      return jsonCors({ ok: false, erro: `Mínimo inválido: ${item.id}` }, { status: 400 });
    }
    if (max !== null && !Number.isFinite(max)) {
      return jsonCors({ ok: false, erro: `Máximo inválido: ${item.id}` }, { status: 400 });
    }
    if (min !== null && max !== null && min > max) {
      return jsonCors(
        { ok: false, erro: `Mínimo maior que máximo em ${item.id}` },
        { status: 400 },
      );
    }
    normalizadas.push({ id: item.id, min, max });
  }

  const config = await salvarFaixas(normalizadas);
  return jsonCors({ ok: true, ...config });
}

export async function DELETE() {
  const negado = await exigirConfigAuth();
  if (negado) return negado;
  const config = await resetarFaixas();
  return jsonCors({ ok: true, mensagem: "Faixas resetadas", ...config });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
