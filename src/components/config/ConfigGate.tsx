"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

async function encerrarSessao() {
  try {
    await fetch("/api/config/auth", { method: "DELETE", credentials: "include", keepalive: true });
  } catch {
    /* ignore */
  }
}

export function ConfigGate({ children }: { children: React.ReactNode }) {
  const [liberado, setLiberado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    encerrarSessao();
    return () => {
      encerrarSessao();
    };
  }, []);

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
      setLiberado(true);
    } catch {
      setErro("Não foi possível validar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await encerrarSessao();
    setLiberado(false);
  }

  if (!liberado) {
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
          onClick={() => encerrarSessao()}
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
        <Link
          href="/"
          onClick={() => encerrarSessao()}
          className="mr-4 text-xs font-semibold text-muted hover:text-accent"
        >
          ← Voltar ao painel
        </Link>
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
