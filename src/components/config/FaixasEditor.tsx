"use client";

import { useCallback, useEffect, useState } from "react";
import { PARAMETROS } from "@/lib/domain/parametros";
import type { FaixaParametro } from "@/lib/domain/types";

interface FaixaForm extends FaixaParametro {
  label: string;
  unidade?: string;
}

function paraForm(faixas: FaixaParametro[]): FaixaForm[] {
  return PARAMETROS.map((p) => {
    const f = faixas.find((x) => x.id === p.id);
    return {
      id: p.id,
      label: p.label,
      unidade: p.unidade,
      min: f?.min ?? null,
      max: f?.max ?? null,
    };
  });
}

function fmtInput(n: number | null): string {
  if (n === null) return "";
  return String(n).replace(".", ",");
}

function parseInput(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function FaixasEditor() {
  const [faixas, setFaixas] = useState<FaixaForm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/faixas", { cache: "no-store", credentials: "include" });
      const data = await res.json();
      setFaixas(paraForm(data.faixas ?? []));
    } catch {
      setMsg("Erro ao carregar faixas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alterar(id: string, campo: "min" | "max", valor: string) {
    setFaixas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: parseInput(valor) } : f)),
    );
    setMsg(null);
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const payload = faixas.map(({ id, min, max }) => ({ id, min, max }));
      const res = await fetch("/api/faixas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ faixas: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao salvar");
      setFaixas(paraForm(data.faixas));
      setMsg("Faixas salvas. Novos testes serão validados com esses limites.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function resetar() {
    if (!confirm("Limpar todas as faixas configuradas?")) return;
    setSalvando(true);
    await fetch("/api/faixas", { method: "DELETE", credentials: "include" });
    await carregar();
    setMsg("Faixas resetadas.");
    setSalvando(false);
  }

  if (carregando) {
    return <p className="text-sm text-muted">Carregando faixas…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Parâmetro</th>
              <th className="px-4 py-3 font-semibold">Mínimo</th>
              <th className="px-4 py-3 font-semibold">Máximo</th>
              <th className="px-4 py-3 font-semibold">Referência</th>
            </tr>
          </thead>
          <tbody>
            {faixas.map((f) => {
              const ref =
                f.min !== null && f.max !== null && f.min <= f.max
                  ? `${fmtInput(f.min)} a ${fmtInput(f.max)}${f.unidade ? ` ${f.unidade}` : ""}`
                  : "—";
              return (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-fg">{f.label}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={fmtInput(f.min)}
                      onChange={(e) => alterar(f.id, "min", e.target.value)}
                      className="w-full rounded-md border border-line bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={fmtInput(f.max)}
                      onChange={(e) => alterar(f.id, "max", e.target.value)}
                      className="w-full rounded-md border border-line bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{ref}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar faixas"}
        </button>
        <button
          type="button"
          onClick={resetar}
          disabled={salvando}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-fg hover:border-falha hover:text-falha disabled:opacity-50"
        >
          Resetar faixas
        </button>
      </div>

      {msg && <p className="text-sm text-accent">{msg}</p>}
    </div>
  );
}
