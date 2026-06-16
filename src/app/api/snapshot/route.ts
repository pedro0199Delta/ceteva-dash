import { NextResponse } from "next/server";
import { listarTestes, lerTurnos } from "@/lib/store";
import { montarSnapshot } from "@/lib/domain/rules";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const linha = searchParams.get("linha")?.trim() ?? "";
  const turnoRaw = searchParams.get("turno")?.trim() ?? "";
  const turnoFiltro =
    turnoRaw === "1" || turnoRaw === "2" || turnoRaw === "3"
      ? (Number(turnoRaw) as 1 | 2 | 3)
      : undefined;

  const [testes, turnos] = await Promise.all([listarTestes(), lerTurnos()]);
  const snapshot = montarSnapshot(testes, {
    linhaFiltro: linha || undefined,
    turnoFiltro,
    turnos,
  });

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
