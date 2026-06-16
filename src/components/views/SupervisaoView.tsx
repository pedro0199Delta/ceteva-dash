import type { Snapshot } from "@/lib/domain/types";
import { indicadorCritico } from "@/lib/domain/rules";
import { parametrosVazios } from "@/lib/domain/parametros";
import { formatDuracao, resultadoLabel, resultadoToken, statusLabel, labelModuloCeteva } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ParametroRow } from "@/components/ui/ParametroRow";
import { ModeloRodape } from "@/components/ui/ModeloRodape";
import { TendenciaChart } from "@/components/charts/TendenciaChart";
import { TaxaParametroChart } from "@/components/charts/TaxaParametroChart";

export function SupervisaoView({ snapshot }: { snapshot: Snapshot }) {
  const teste = snapshot.atual;
  const critico = teste ? indicadorCritico(teste) : null;
  const parametros = teste?.parametros ?? parametrosVazios();
  const yieldTxt =
    snapshot.yieldTurno.taxa > 0
      ? `${snapshot.yieldTurno.taxa.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%`
      : "—";
  const turnoBadge = snapshot.turnoAtual?.label ?? "Turno";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <SectionLabel>Operação</SectionLabel>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            titulo="Status do teste"
            badge={teste?.linha || "Linha"}
            valor={teste ? resultadoLabel[teste.resultado] : "—"}
            sub={teste?.serial ? `Série ${teste.serial}` : "—"}
            token={teste ? resultadoToken(teste.resultado) : "none"}
            pulse={teste?.resultado === "reprovado"}
          />
          <MetricCard
            titulo="Resultado do turno"
            badge={turnoBadge}
            valor={yieldTxt}
            sub={
              snapshot.yieldTurno.aprovados + snapshot.yieldTurno.reprovados > 0
                ? `${snapshot.yieldTurno.aprovados} aprov. · ${snapshot.yieldTurno.reprovados} reprov.`
                : snapshot.turnoAtual
                  ? `${snapshot.turnoAtual.inicio}–${snapshot.turnoAtual.fim}`
                  : "—"
            }
            token="none"
          />
          <MetricCard
            titulo="Tempo médio"
            badge="Exec."
            valor={formatDuracao(snapshot.tempoMedioSeg)}
            sub="Por unidade"
            token="none"
          />
          <MetricCard
            titulo="Equipamento em teste"
            badge="Nº Série"
            valor={teste?.serial || "—"}
            sub={teste?.serialModelo || teste?.modelo ? `Modelo ${teste.serialModelo || teste.modelo}` : "—"}
            token="none"
          />
          <MetricCard
            titulo="Indicador crítico"
            badge="Supervisão"
            valor={critico ? critico.label : "—"}
            sub={critico ? statusLabel[critico.status] : "—"}
            token={critico ? (critico.status === "falha" ? "falha" : "atencao") : "none"}
            pulse={critico?.status === "falha"}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <SectionLabel>Parâmetros</SectionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {parametros.map((p) => (
              <ParametroRow key={p.id} p={p} />
            ))}
          </div>

          <div className="mt-1 grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-bold text-fg">Tendência do turno (por hora)</h3>
              <TendenciaChart dados={snapshot.tendencia} />
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-bold text-fg">Taxa de aprovação por parâmetro</h3>
              <TaxaParametroChart dados={snapshot.taxaPorParametro} />
            </Card>
          </div>
        </div>

        <Card className="flex flex-col p-4">
          <h3 className="mb-3 text-sm font-bold text-fg">Exceções prioritárias</h3>
          {snapshot.excecoes.length === 0 ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {snapshot.excecoes.map((e, i) => (
                <li
                  key={`${e.tipo}-${i}`}
                  className={`flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 ${
                    e.nivel === "falha" ? "edge-falha" : "edge-atencao"
                  }`}
                >
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      e.nivel === "falha"
                        ? "bg-falha-soft text-falha"
                        : "bg-atencao-soft text-atencao"
                    }`}
                  >
                    {e.nivel === "falha" ? "Crítico" : "Atenção"}
                  </span>
                  <span className="text-sm text-fg">{e.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-bold text-fg">Rastreabilidade CETEVA</h3>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
          <span>Série {teste?.serial || "—"}</span>
          <span>·</span>
          <span>Código modelo {teste?.serialModelo || "—"}</span>
          <span>·</span>
          <span>Linha {teste?.linha || "—"}</span>
          <span>·</span>
          <span>Execução {teste?.dthGeraLog || teste?.dthInicio || "—"}</span>
          <span>·</span>
          <span>CETEVA {labelModuloCeteva(teste)}</span>
        </div>
      </Card>

      <ModeloRodape
        serialModelo={teste?.serialModelo}
        decodificado={teste?.modeloDecodificado}
      />
    </div>
  );
}
