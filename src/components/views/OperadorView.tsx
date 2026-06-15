import type { Snapshot, Teste } from "@/lib/domain/types";
import { indicadorCritico } from "@/lib/domain/rules";
import { parametrosVazios, SEMAFORO_OPERADOR } from "@/lib/domain/parametros";
import { resultadoLabel, resultadoToken, statusLabel, statusToken } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { ModeloRodape } from "@/components/ui/ModeloRodape";
import { SemaforoItem } from "@/components/ui/SemaforoItem";

function mensagemOperacional(teste: Teste): {
  token: "ok" | "atencao" | "falha";
  titulo: string;
  detalhe?: string;
} {
  const falha = teste.parametros.find((p) => p.status === "falha");
  const atencao = teste.parametros.find((p) => p.status === "atencao");
  if (teste.resultado === "reprovado" || falha) {
    return {
      token: "falha",
      titulo: falha ? `Falha crítica: ${falha.label}` : "Teste reprovado",
      detalhe: "Ação imediata requerida.",
    };
  }
  if (atencao) {
    return {
      token: "atencao",
      titulo: `Atenção: ${atencao.label} próximo do limite`,
      detalhe: "Acompanhar parâmetro.",
    };
  }
  return {
    token: "ok",
    titulo: "Todos os testes críticos em conformidade",
  };
}

const barra: Record<"ok" | "atencao" | "falha", string> = {
  ok: "bg-ok",
  atencao: "bg-atencao",
  falha: "bg-falha",
};

export function OperadorView({ snapshot }: { snapshot: Snapshot }) {
  const teste = snapshot.atual;
  const params = teste?.parametros ?? parametrosVazios();
  const param = (id: string) => params.find((p) => p.id === id)!;
  const critico = teste ? indicadorCritico(teste) : null;
  const semaforo = SEMAFORO_OPERADOR.map((id) => param(id));
  const msg = teste
    ? mensagemOperacional(teste)
    : { token: "accent" as const, titulo: "—" };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Linha superior: cards essenciais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          titulo="Teste atual"
          badge="Nº Série"
          valor={teste?.serial || "—"}
          sub={teste?.serialModelo || teste?.modelo || "—"}
          token="accent"
          borda="top"
          valorAdaptavel
        />
        <MetricCard
          titulo="Linha"
          badge={teste?.turnoLabel || snapshot.turnoAtual?.label || "Turno"}
          valor={teste?.linha || snapshot.linhaFiltro || "—"}
          sub={teste?.ipCeteva ? `CETEVA ${teste.ipCeteva}` : snapshot.linhaFiltro ? `Filtro: ${snapshot.linhaFiltro}` : "—"}
          token="accent"
          borda="top"
          valorAdaptavel
        />
        <MetricCard
          titulo="Resultado"
          badge="Status"
          valor={teste ? resultadoLabel[teste.resultado] : "—"}
          sub={
            teste
              ? `Código ${teste.resultado === "aprovado" ? "0" : teste.resultado === "reprovado" ? "1" : "—"}`
              : "—"
          }
          token={teste ? resultadoToken(teste.resultado) : "none"}
          borda="top"
          pulse={teste?.resultado === "reprovado"}
        />
        <MetricCard
          titulo="Atenção prioritária"
          badge={critico ? critico.label : "—"}
          valor={
            critico
              ? critico.status === "falha"
                ? `${critico.label} em falha`
                : critico.label
              : "—"
          }
          sub={critico ? statusLabel[critico.status] : "—"}
          token={critico ? statusToken(critico.status) : "none"}
          borda="top"
          pulse={critico?.status === "falha"}
          valorAdaptavel
        />
      </div>

      {/* Faixa de parâmetros (steps) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {semaforo.map((p) => (
          <SemaforoItem key={p.id} p={p} />
        ))}
      </div>

      <Card
        edge={teste && msg.token !== "accent" ? msg.token : "none"}
        pulse={Boolean(teste && msg.token === "falha")}
        className="flex flex-1 flex-col justify-center p-6"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          Mensagem operacional
        </span>
        <h2
          className={`mt-2 text-3xl font-extrabold leading-tight md:text-5xl ${
            !teste
              ? "text-muted"
              : msg.token === "ok"
                ? "text-fg"
                : msg.token === "atencao"
                  ? "text-atencao"
                  : "text-falha"
          }`}
        >
          {msg.titulo}
        </h2>
        {"detalhe" in msg && msg.detalhe && (
          <p className="mt-3 text-sm text-muted">{msg.detalhe}</p>
        )}
        {teste && msg.token !== "accent" && (
          <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-panel-2">
            <div
              className={`h-full rounded-full ${barra[msg.token]}`}
              style={{
                width: msg.token === "ok" ? "100%" : msg.token === "atencao" ? "60%" : "30%",
              }}
            />
          </div>
        )}
      </Card>

      <ModeloRodape
        serialModelo={teste?.serialModelo}
        decodificado={teste?.modeloDecodificado}
      />
    </div>
  );
}
