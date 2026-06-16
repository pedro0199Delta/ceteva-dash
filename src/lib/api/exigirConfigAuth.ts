import { jsonCors } from "@/lib/api/cors";
import { configAutenticado } from "@/lib/api/configAuth";

export async function respostaConfigNegada() {
  return jsonCors({ ok: false, erro: "Acesso à configuração negado" }, { status: 401 });
}

export async function exigirConfigAuth() {
  if (!(await configAutenticado())) {
    return respostaConfigNegada();
  }
  return null;
}
