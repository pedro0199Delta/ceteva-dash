"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

export function ConfigGate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "bloqueado" | "liberado">("carregando");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const verificar = useCallback(async () => {
    try {
      const res = await fetch("/api/config/auth", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      setEstado(data.autenticado ? "liberado" : "bloqueado");
    } catch {
      setEstado("bloqueado");
    }
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/config/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro ?? "Senha incorreta");
        return;
      }
      setSenha("");
      setEstado("liberado");
    } catch {
      setErro("Não foi possível validar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await fetch("/api/config/auth", { method: "DELETE", credentials: "include" });
    setEstado("bloqueado");
  }

  if (estado === "carregando") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Verificando acesso…
      </div>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-5">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-fg">Configuração</h1>
          <p className="mt-1 text-sm text-muted">Acesso restrito · CETEVA | Elgin</p>
        </div>

        <Card className="p-5">
          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label htmlFor="config-senha" className="text-xs font-bold uppercase tracking-wide text-muted">
                Senha
              </label>
              <input
                id="config-senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2.5 text-fg outline-none focus:border-accent"
                placeholder="Digite a senha"
              />
            </div>
            {erro && <p className="text-sm text-falha">{erro}</p>}
            <button
              type="submit"
              disabled={enviando || !senha}
              className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </Card>

        <Link
          href="/"
          className="text-center text-sm font-semibold text-muted hover:text-accent"
        >
          ← Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-3xl justify-end px-5 pt-5">
        <button
          type="button"
          onClick={sair}
          className="text-xs font-semibold text-muted hover:text-falha"
        >
          Sair da configuração
        </button>
      </div>
      {children}
    </>
  );
}
