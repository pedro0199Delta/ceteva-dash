import type { TurnoDef } from "@/lib/domain/types";
import { lerTurnos, resetarTurnos, salvarTurnos } from "@/lib/store";
import { jsonCors, optionsCors } from "@/lib/api/cors";
import { exigirConfigAuth } from "@/lib/api/exigirConfigAuth";

export const dynamic = "force-dynamic";

function validarTurnos(lista: unknown): TurnoDef[] | null {
  if (!Array.isArray(lista) || lista.length !== 3) return null;
  const ids = new Set<number>();
  const normalizados: TurnoDef[] = [];

  for (const item of lista) {
    if (!item || typeof item !== "object") return null;
    const raw = item as { id?: unknown; label?: unknown; inicio?: unknown };
    const id = Number(raw.id);
    if (id !== 1 && id !== 2 && id !== 3) return null;
    if (ids.has(id)) return null;
    ids.add(id);
    const inicio = String(raw.inicio ?? "").trim();
    if (!/^\d{1,2}:\d{2}$/.test(inicio)) return null;
    normalizados.push({
      id: id as 1 | 2 | 3,
      label: String(raw.label ?? `${id}º turno`).trim() || `${id}º turno`,
      inicio,
    });
  }

  return normalizados.sort((a, b) => a.id - b.id);
}

export async function OPTIONS() {
  return optionsCors();
}

export async function GET() {
  const config = await lerTurnos();
  return jsonCors(config);
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

  const turnos = validarTurnos((corpo as { turnos?: unknown }).turnos);
  if (!turnos) {
    return jsonCors({ ok: false, erro: "Informe exatamente 3 turnos com id, label e inicio (HH:mm)" }, { status: 400 });
  }

  const config = await salvarTurnos(turnos);
  return jsonCors({ ok: true, ...config });
}

export async function DELETE() {
  const negado = await exigirConfigAuth();
  if (negado) return negado;
  const config = await resetarTurnos();
  return jsonCors({ ok: true, mensagem: "Turnos resetados", ...config });
}
