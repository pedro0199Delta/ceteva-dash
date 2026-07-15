import { NextResponse } from "next/server";
import { montarRelatorio, type FiltroRelatorio } from "@/lib/domain/relatorio";
import { listarTestes, lerTurnos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const linha = searchParams.get("linha")?.trim() || undefined;

  let filtro: FiltroRelatorio;

  if (tipo === "turno") {
    const data = searchParams.get("data")?.trim();
    const turnoRaw = searchParams.get("turno")?.trim();
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json({ erro: "Data inválida (YYYY-MM-DD)" }, { status: 400 });
    }
    if (turnoRaw !== "1" && turnoRaw !== "2" && turnoRaw !== "3") {
      return NextResponse.json({ erro: "Turno deve ser 1, 2 ou 3" }, { status: 400 });
    }
    filtro = {
      tipo: "turno",
      data,
      turno: Number(turnoRaw) as 1 | 2 | 3,
      linha,
    };
  } else if (tipo === "periodo") {
    const inicio = searchParams.get("inicio")?.trim();
    const fim = searchParams.get("fim")?.trim();
    if (!inicio || !fim) {
      return NextResponse.json({ erro: "Informe início e fim do período" }, { status: 400 });
    }
    filtro = { tipo: "periodo", inicio, fim, linha };
  } else {
    return NextResponse.json({ erro: "tipo deve ser turno ou periodo" }, { status: 400 });
  }

  const [testes, turnos] = await Promise.all([listarTestes(), lerTurnos()]);
  const relatorio = montarRelatorio(testes, filtro, turnos);

  return NextResponse.json(relatorio, {
    headers: { "Cache-Control": "no-store" },
  });
}
