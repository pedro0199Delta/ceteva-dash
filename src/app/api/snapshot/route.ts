import { NextResponse } from "next/server";
import { listarTestes, lerTurnos } from "@/lib/store";
import { montarSnapshot } from "@/lib/domain/rules";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const linha = searchParams.get("linha")?.trim() ?? "";

  const [testes, turnos] = await Promise.all([listarTestes(), lerTurnos()]);
  const snapshot = montarSnapshot(testes, {
    linhaFiltro: linha || undefined,
    turnos,
  });

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
