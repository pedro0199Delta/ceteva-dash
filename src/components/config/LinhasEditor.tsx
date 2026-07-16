"use client";

import { useCallback, useEffect, useState } from "react";

export function LinhasEditor() {
  const [linhas, setLinhas] = useState<string[]>([]);
  const [nova, setNova] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/linhas", { cache: "no-store" });
      const data = await res.json();
      setLinhas(data.linhas ?? []);
    } catch {
      setMsg("Erro ao carregar linhas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function adicionar() {
    const nome = nova.trim();
    if (!nome || linhas.includes(nome)) return;
    setLinhas((prev) => [...prev, nome]);
    setNova("");
    setMsg(null);
  }

  function remover(nome: string) {
    setLinhas((prev) => prev.filter((l) => l !== nome));
    setMsg(null);
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/linhas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ linhas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao salvar");
      setLinhas(data.linhas);
      setMsg("Linhas salvas. Use o filtro no painel para exibir só a linha desejada.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p className="text-sm text-muted">Carregando linhas…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Nome da linha"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
          className="min-w-[200px] flex-1 rounded-md border border-line bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={adicionar}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-fg hover:border-accent hover:text-accent"
        >
          Adicionar
        </button>
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma linha cadastrada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {linhas.map((l) => (
            <li
              key={l}
              className="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-4 py-2.5"
            >
              <span className="font-medium text-fg">{l}</span>
              <button
                type="button"
                onClick={() => remover(l)}
                className="text-sm font-semibold text-falha hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {salvando ? "Salvando…" : "Salvar linhas"}
      </button>

      {msg && <p className="text-sm text-accent">{msg}</p>}
    </div>
  );
}
