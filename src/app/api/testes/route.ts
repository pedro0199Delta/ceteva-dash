import { adicionarTeste, limparTestes, listarTestes } from "@/lib/store";
import type { TesteBruto } from "@/lib/domain/types";
import { corsHeaders, jsonCors, optionsCors } from "@/lib/api/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsCors();
}

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return jsonCors({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  const itens = Array.isArray(corpo) ? corpo : [corpo];
  if (itens.length === 0) {
    return jsonCors({ ok: false, erro: "Nenhum registro no corpo" }, { status: 400 });
  }

  const ids: string[] = [];
  const erros: string[] = [];

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    if (!item || typeof item !== "object") {
      erros.push(`Item ${i + 1}: não é um objeto JSON`);
      continue;
    }
    try {
      const teste = await adicionarTeste(item as TesteBruto);
      ids.push(teste.id);
    } catch (e) {
      erros.push(`Item ${i + 1}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }

  if (ids.length === 0) {
    return jsonCors({ ok: false, erro: "Nenhum registro aceito", detalhes: erros }, { status: 400 });
  }

  const total = (await listarTestes()).length;
  return jsonCors({
    ok: true,
    recebidos: ids.length,
    ids,
    total,
    ...(erros.length ? { avisos: erros } : {}),
  });
}

export async function GET() {
  const testes = await listarTestes();
  return jsonCors({
    ok: true,
    pronto: true,
    mensagem: "API pronta para receber testes via POST",
    total: testes.length,
    endpoint: "POST /api/testes",
    testes: testes.slice(-50).reverse(),
  });
}

export async function DELETE() {
  await limparTestes();
  return jsonCors({ ok: true, mensagem: "Histórico limpo" });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
