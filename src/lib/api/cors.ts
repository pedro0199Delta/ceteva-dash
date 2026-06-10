import { NextResponse } from "next/server";

/** Cabeçalhos CORS — permite POST do app externo via WiFi/rede local. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonCors(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

export function optionsCors() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
