import { NextResponse } from "next/server";
import {
  CONFIG_AUTH_COOKIE,
  configAutenticado,
  senhaConfigValida,
} from "@/lib/api/configAuth";
import { jsonCors, optionsCors } from "@/lib/api/cors";

export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
};

export async function OPTIONS() {
  return optionsCors();
}

/** Verifica se a sessão de configuração está ativa. */
export async function GET() {
  return jsonCors({ autenticado: await configAutenticado() });
}

/** Valida senha e abre sessão (8 h). */
export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return jsonCors({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  const senha = String((corpo as { senha?: unknown }).senha ?? "");
  if (!senhaConfigValida(senha)) {
    return jsonCors({ ok: false, erro: "Senha incorreta" }, { status: 401 });
  }

  const res = jsonCors({ ok: true });
  res.cookies.set(CONFIG_AUTH_COOKIE, "1", COOKIE_OPTS);
  return res;
}

/** Encerra sessão de configuração. */
export async function DELETE() {
  const res = jsonCors({ ok: true });
  res.cookies.set(CONFIG_AUTH_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
