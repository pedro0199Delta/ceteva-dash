import { NextResponse } from "next/server";
import { listarTestes } from "@/lib/store";
import { montarSnapshot } from "@/lib/domain/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const testes = await listarTestes();
  const snapshot = montarSnapshot(testes);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
