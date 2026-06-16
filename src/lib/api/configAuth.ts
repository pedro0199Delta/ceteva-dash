import { cookies } from "next/headers";

export const CONFIG_AUTH_COOKIE = "ceteva_config_auth";

export function senhaConfigValida(senha: string): boolean {
  const esperada = process.env.CONFIG_SENHA ?? "adm@@";
  return senha === esperada;
}

export async function configAutenticado(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(CONFIG_AUTH_COOKIE)?.value === "1";
}
