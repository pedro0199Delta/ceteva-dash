"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useLinhasCadastro } from "@/hooks/useLinhasCadastro";
import { useTurnosCadastro } from "@/hooks/useTurnosCadastro";
import { agoraFabrica, partesDataFabrica } from "@/lib/domain/fusoFabrica";
import type { RelatorioData } from "@/lib/domain/relatorio";
import { exportarRelatorioPdf } from "@/lib/relatorioPdf";

type ModoFiltro = "turno" | "periodo";

function hojeIso(): string {
  const { ano, mes, dia } = partesDataFabrica(agoraFabrica());
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("pt-BR");
}

function fmtPct(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

function BarraHorizontal({
  pct,
  cor,
  max = 100,
}: {
  pct: number;
  cor: "blue" | "orange";
  max?: number;
}) {
  const largura = max > 0 ? Math.min(100, Math.max(0, (pct / max) * 100)) : 0;
  const bg = cor === "blue" ? "bg-accent" : "bg-atencao";
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${largura}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums">{fmtPct(pct)}</span>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: "blue" | "green" | "red" | "purple";
}) {
  const cores: Record<typeof cor, string> = {
    blue: "bg-[#3b82f6]",
    green: "bg-[#15803d]",
    red: "bg-[#dc2626]",
    purple: "bg-[#7c3aed]",
  };
  return (
    <div className={`rounded-lg px-4 py-5 text-white shadow-sm ${cores[cor]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-95">{titulo}</p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums">{valor}</p>
    </div>
  );
}

export default function RelatorioPage() {
  const { config } = useConfig();
  const linhas = useLinhasCadastro();
  const turnos = useTurnosCadastro();

  const [modo, setModo] = useState<ModoFiltro>("turno");
  const [data, setData] = useState(hojeIso);
  const [turno, setTurno] = useState<"1" | "2" | "3">("1");
  const [inicio, setInicio] = useState(() => `${hojeIso()}T00:00`);
  const [fim, setFim] = useState(() => `${hojeIso()}T23:59`);
  const [linha, setLinha] = useState(config.linhaFiltro);

  const [carregando, setCarregando] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);

  useEffect(() => {
    if (config.linhaFiltro && !linha) setLinha(config.linhaFiltro);
  }, [config.linhaFiltro, linha]);

  const maxFalhasCategoria = useMemo(() => {
    if (!relatorio) return 1;
    return Math.max(1, ...relatorio.categoriasFalha.map((c) => c.total));
  }, [relatorio]);

  const gerar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({ tipo: modo });
      if (linha.trim()) params.set("linha", linha.trim());
      if (modo === "turno") {
        params.set("data", data);
        params.set("turno", turno);
      } else {
        params.set("inicio", inicio);
        params.set("fim", fim);
      }
      const res = await fetch(`/api/relatorio?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.erro ?? "Erro ao gerar relatório");
        setRelatorio(null);
        return;
      }
      setRelatorio(json as RelatorioData);
    } catch {
      setErro("Falha na comunicação com o servidor");
      setRelatorio(null);
    } finally {
      setCarregando(false);
    }
  }, [modo, data, turno, inicio, fim, linha]);

  const baixarPdf = useCallback(() => {
    if (!relatorio) return;
    setBaixandoPdf(true);
    try {
      exportarRelatorioPdf(relatorio, maxFalhasCategoria);
    } finally {
      setBaixandoPdf(false);
    }
  }, [relatorio, maxFalhasCategoria]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div>
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            ← Voltar ao painel
          </Link>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-fg">Relatório de produção</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <section className="rounded-xl border border-line bg-panel p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Filtros</h2>

          <div className="mb-4 inline-flex rounded-lg border border-line bg-panel-2 p-1">
            <button
              type="button"
              onClick={() => setModo("turno")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                modo === "turno" ? "bg-accent text-white" : "text-muted hover:text-fg"
              }`}
            >
              Por turno
            </button>
            <button
              type="button"
              onClick={() => setModo("periodo")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                modo === "periodo" ? "bg-accent text-white" : "text-muted hover:text-fg"
              }`}
            >
              Por data / período
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {modo === "turno" ? (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-muted">Data</span>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="rounded-md border border-line bg-panel-2 px-3 py-2 text-fg outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-muted">Turno</span>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as "1" | "2" | "3")}
                    className="rounded-md border border-line bg-panel-2 px-3 py-2 font-semibold text-fg outline-none focus:border-accent"
                  >
                    {turnos.length > 0
                      ? turnos.map((t) => (
                          <option key={t.id} value={String(t.id)}>
                            {t.label} ({t.inicio})
                          </option>
                        ))
                      : (
                          <>
                            <option value="1">1º turno</option>
                            <option value="2">2º turno</option>
                            <option value="3">3º turno</option>
                          </>
                        )}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-muted">Início</span>
                  <input
                    type="datetime-local"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="rounded-md border border-line bg-panel-2 px-3 py-2 text-fg outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-muted">Fim</span>
                  <input
                    type="datetime-local"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                    className="rounded-md border border-line bg-panel-2 px-3 py-2 text-fg outline-none focus:border-accent"
                  />
                </label>
              </>
            )}

            {linhas.length > 0 && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-muted">Linha</span>
                <select
                  value={linha}
                  onChange={(e) => setLinha(e.target.value)}
                  className="rounded-md border border-line bg-panel-2 px-3 py-2 font-semibold text-fg outline-none focus:border-accent"
                >
                  <option value="">Todas</option>
                  {linhas.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={gerar}
              disabled={carregando}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {carregando ? "Gerando…" : "Gerar relatório"}
            </button>
          </div>

          {erro && <p className="mt-4 text-sm font-semibold text-falha">{erro}</p>}
        </section>

        {relatorio && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted">Período: {relatorio.periodo.descricao}</p>
              <button
                type="button"
                onClick={baixarPdf}
                disabled={baixandoPdf}
                className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-bold text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {baixandoPdf ? "Gerando PDF…" : "Baixar PDF"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CardResumo titulo="Total de unidades testadas" valor={fmtNum(relatorio.resumo.total)} cor="blue" />
              <CardResumo titulo="Unidades aprovadas" valor={fmtNum(relatorio.resumo.aprovados)} cor="green" />
              <CardResumo titulo="Unidades reprovadas" valor={fmtNum(relatorio.resumo.reprovados)} cor="red" />
              <CardResumo titulo="Taxa geral de aprovação" valor={fmtPct(relatorio.resumo.taxa)} cor="purple" />
            </div>

            <section className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="border-b border-line bg-accent px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">Desempenho por máquina</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel-2 text-left text-xs font-bold uppercase text-muted">
                      <th className="px-4 py-3">Máquina</th>
                      <th className="px-4 py-3 text-right">Testados</th>
                      <th className="px-4 py-3 text-right">Aprovados</th>
                      <th className="px-4 py-3 text-right">Reprovados</th>
                      <th className="px-4 py-3">Taxa de aprovação</th>
                      <th className="px-4 py-3 text-right">Participação nas falhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.maquinas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted">
                          Nenhum teste no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      relatorio.maquinas.map((m, i) => (
                        <tr
                          key={m.id}
                          className={i % 2 === 0 ? "bg-panel" : "bg-panel-2/60"}
                        >
                          <td className="px-4 py-3 font-semibold">{m.label}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{fmtNum(m.testados)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-ok">{fmtNum(m.aprovados)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-falha">{fmtNum(m.reprovados)}</td>
                          <td className="px-4 py-3">
                            <BarraHorizontal pct={m.taxa} cor="blue" />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{fmtPct(m.participacaoFalhas)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="border-b border-line bg-accent px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Análise de falhas por categoria
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel-2 text-left text-xs font-bold uppercase text-muted">
                      <th className="px-4 py-3">Categoria</th>
                      {relatorio.maquinaIds.map((id) => (
                        <th key={id} className="px-4 py-3 text-right">
                          {id === "—" ? "Sem máq." : id}
                        </th>
                      ))}
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3 text-right">% do total de falhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.categoriasFalha.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-panel" : "bg-panel-2/60"}>
                        <td className="px-4 py-3 font-semibold">{c.label}</td>
                        {relatorio.maquinaIds.map((id) => (
                          <td key={id} className="px-4 py-3 text-right tabular-nums">
                            {fmtNum(c.porMaquina[id] ?? 0)}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex min-w-[120px] items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
                              <div
                                className="h-full rounded-full bg-atencao"
                                style={{
                                  width: `${Math.min(100, (c.total / maxFalhasCategoria) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">
                              {fmtNum(c.total)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtPct(c.percentualFalhas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
