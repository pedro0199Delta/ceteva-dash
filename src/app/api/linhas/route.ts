import { lerLinhas, salvarLinhas } from "@/lib/store";
import { jsonCors, optionsCors } from "@/lib/api/cors";

export const dynamic = "force-dynamic";

function normalizarLista(lista: unknown): string[] | null {
  if (!Array.isArray(lista)) return null;
  return [...new Set(lista.map((l) => String(l).trim()).filter(Boolean))];
}

export async function OPTIONS() {
  return optionsCors();
}

export async function GET() {
  const config = await lerLinhas();
  return jsonCors(config);
}

export async function PUT(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return jsonCors({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  const linhas = normalizarLista((corpo as { linhas?: unknown }).linhas);
  if (!linhas) {
    return jsonCors({ ok: false, erro: "Campo 'linhas' obrigatório (array de textos)" }, { status: 400 });
  }

  const config = await salvarLinhas(linhas);
  return jsonCors({ ok: true, ...config });
}
