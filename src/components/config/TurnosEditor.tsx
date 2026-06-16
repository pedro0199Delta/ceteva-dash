"use client";

import { useCallback, useEffect, useState } from "react";
import type { TurnoDef } from "@/lib/domain/types";

export function TurnosEditor() {
  const [turnos, setTurnos] = useState<TurnoDef[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/turnos", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      setTurnos(data.turnos ?? []);
    } catch {
      setMsg("Erro ao carregar turnos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alterar(id: 1 | 2 | 3, campo: "label" | "inicio", valor: string) {
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)));
    setMsg(null);
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/turnos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ turnos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao salvar");
      setTurnos(data.turnos);
      setMsg("Turnos salvos. Métricas zeram automaticamente ao mudar o turno (usa dthGeraLog).");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function resetar() {
    if (!confirm("Restaurar horários padrão dos turnos?")) return;
    setSalvando(true);
    await fetch("/api/turnos", { method: "DELETE", credentials: "include" });
    await carregar();
    setMsg("Turnos resetados.");
    setSalvando(false);
  }

  if (carregando) {
    return <p className="text-sm text-muted">Carregando turnos…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Defina o horário de início de cada turno. Yield, tendência e totais consideram apenas testes
        cujo <strong className="text-fg">dthGeraLog</strong> caia no turno vigente — ao mudar o turno,
        os contadores recomeçam.
      </p>

      <div className="space-y-3">
        {turnos.map((t) => (
          <div
            key={t.id}
            className="grid gap-3 rounded-lg border border-line bg-panel-2 p-4 sm:grid-cols-[1fr_120px]"
          >
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted">Nome</label>
              <input
                type="text"
                value={t.label}
                onChange={(e) => alterar(t.id, "label", e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted">Início</label>
              <input
                type="time"
                value={t.inicio}
                onChange={(e) => alterar(t.id, "inicio", e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar turnos"}
        </button>
        <button
          type="button"
          onClick={resetar}
          disabled={salvando}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-fg hover:border-falha hover:text-falha disabled:opacity-50"
        >
          Restaurar padrão
        </button>
      </div>

      {msg && <p className="text-sm text-accent">{msg}</p>}
    </div>
  );
}
