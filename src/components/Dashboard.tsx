"use client";

import { useConfig } from "@/context/ConfigContext";
import { useSnapshot } from "@/hooks/useSnapshot";
import { montarSnapshot } from "@/lib/domain/rules";
import { Topbar } from "@/components/Topbar";
import { OperadorView } from "@/components/views/OperadorView";

export function Dashboard() {
  const { config, carregado } = useConfig();
  const { snapshot } = useSnapshot(config.intervaloMs, config.linhaFiltro);

  const dados = snapshot ?? montarSnapshot([]);
  const conectado =
    !!dados.atual &&
    Date.now() - new Date(dados.atual.recebidoEm).getTime() < 30000;

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        conectado={conectado}
        ultimaAtualizacao={dados.ultimaAtualizacao}
        turnoAtual={dados.turnoAtual}
      />
      {!carregado ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted">Carregando…</div>
      ) : (
        <OperadorView snapshot={dados} />
      )}
    </div>
  );
}
