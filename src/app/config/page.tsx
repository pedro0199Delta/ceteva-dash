"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfig, type Modo, type Tema } from "@/context/ConfigContext";
import { Card } from "@/components/ui/Card";
import { FaixasEditor } from "@/components/config/FaixasEditor";
import { TurnosEditor } from "@/components/config/TurnosEditor";
import { LinhasEditor } from "@/components/config/LinhasEditor";
import { ConfigGate } from "@/components/config/ConfigGate";

function Segmented<T extends string>({
  valor,
  opcoes,
  onChange,
}: {
  valor: T;
  opcoes: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel-2 p-1">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            valor === o.id ? "bg-accent text-white" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Linha({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-semibold text-fg">{titulo}</h3>
        <p className="mt-0.5 text-sm text-muted">{descricao}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function ConfigPage() {
  const { config, setConfig } = useConfig();
  const [url, setUrl] = useState("http://<IP-do-console>:3000/api/testes");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(`${window.location.origin}/api/testes`);
    }
  }, []);

  async function limparDados() {
    const res = await fetch("/api/testes", { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setMsg("Sem permissão. Faça login novamente.");
      return;
    }
    setMsg("Histórico limpo. Aguardando novos dados.");
  }

  return (
    <ConfigGate>
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 p-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">Configuração</h1>
          <p className="text-sm text-muted">Ajustes do console Elgin · CETEVA</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          ← Voltar ao painel
        </Link>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-fg">Turnos de produção</h3>
        <p className="mt-0.5 text-sm text-muted">
          Horários do 1º, 2º e 3º turno. Estatísticas zeram ao mudar o turno (base: dthGeraLog).
        </p>
        <div className="mt-4">
          <TurnosEditor />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-fg">Linhas de produção</h3>
        <p className="mt-0.5 text-sm text-muted">
          Cadastre os nomes das linhas para filtrar o painel. Devem coincidir com{" "}
          <code className="text-fg">linha_producao</code> enviado pelo CETEVA.
        </p>
        <div className="mt-4">
          <LinhasEditor />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-fg">Faixas de aprovação</h3>
        <p className="mt-0.5 text-sm text-muted">
          Limites min/máx por parâmetro — a dash valida cada teste recebido e marca o que falhou.
        </p>
        <div className="mt-4">
          <FaixasEditor />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-fg">Integração HTTP (app CETEVA)</h3>
        <p className="mt-0.5 text-sm text-muted">
          Envie cada teste concluído via POST. A dashboard inicia vazia e exibe os dados assim que
          chegarem pela rede WiFi.
        </p>

        <div className="mt-4 rounded-lg border border-line bg-panel-2 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">URL de envio</p>
          <code className="mt-2 block break-all text-sm font-semibold text-accent">{url}</code>
        </div>

        <pre className="mt-4 overflow-x-auto rounded-lg bg-panel-2 p-3 text-xs text-fg">
{`POST /api/testes
Content-Type: application/json

{
  "serial": "",
  "serialModelo": "45HJFI12C2WG",
  "linha_producao": "Linha 01",
  "dthInicio": "20/05/2026 15:41:15",
  "dthGeraLog": "2026-05-20 15:41:15",
  "tempo_teste": "00:00:31",
  "status": "fail",
  "Corrente (A)": 0,
  "Ligar Dispositivo": "",
  "Potencia (W)": "",
  "Display": "",
  "Aleta": "",
  "Ruido": "",
  "Fluxo": "",
  "Comunicacao ODU": "",
  "Botao ON/OFF": ""
}`}
        </pre>

        <p className="mt-3 text-xs text-muted">
          <strong className="text-fg">status:</strong>{" "}
          <code>pass</code>/<code>fail</code> do JSON · a dash também valida pelas faixas
          configuradas acima (prioridade em caso de falha de parâmetro).
        </p>

        <button
          type="button"
          onClick={limparDados}
          className="mt-4 rounded-md border border-line px-4 py-2 text-sm font-semibold text-fg hover:border-falha hover:text-falha"
        >
          Limpar histórico recebido
        </button>
        {msg && <p className="mt-3 text-sm text-accent">{msg}</p>}
      </Card>

      <Card className="px-5">
        <Linha titulo="Modo de exibição" descricao="Alterna entre o console do operador e a visão expandida de supervisão.">
          <Segmented<Modo>
            valor={config.modo}
            opcoes={[
              { id: "operador", label: "Operador" },
              { id: "supervisao", label: "Supervisão" },
            ]}
            onChange={(modo) => setConfig({ modo })}
          />
        </Linha>

        <Linha titulo="Tema" descricao="Escuro recomendado para o chão de fábrica.">
          <Segmented<Tema>
            valor={config.tema}
            opcoes={[
              { id: "dark", label: "Escuro" },
              { id: "light", label: "Claro" },
              { id: "system", label: "Sistema" },
            ]}
            onChange={(tema) => setConfig({ tema })}
          />
        </Linha>

        <Linha titulo="Intervalo de atualização" descricao="Frequência de leitura dos dados recebidos (polling).">
          <Segmented<string>
            valor={String(config.intervaloMs)}
            opcoes={[
              { id: "1000", label: "1s" },
              { id: "2000", label: "2s" },
              { id: "5000", label: "5s" },
            ]}
            onChange={(v) => setConfig({ intervaloMs: Number(v) })}
          />
        </Linha>
      </Card>
    </div>
    </ConfigGate>
  );
}
