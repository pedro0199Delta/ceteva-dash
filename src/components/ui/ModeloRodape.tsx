import type { ModeloDecodificado } from "@/lib/domain/types";
import { Card } from "@/components/ui/Card";

export function ModeloRodape({
  serialModelo,
  decodificado,
}: {
  serialModelo?: string;
  decodificado?: ModeloDecodificado | null;
}) {
  const codigo = decodificado?.codigo || serialModelo?.trim() || "";

  return (
    <Card className="mt-auto shrink-0 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
            Código do modelo
          </h3>
          <p className="mt-1 font-mono text-lg font-bold tracking-wide text-fg">
            {codigo || "—"}
          </p>
        </div>
        {decodificado?.resumo && decodificado.resumo !== "—" && (
          <p className="max-w-2xl text-right text-sm text-muted">{decodificado.resumo}</p>
        )}
      </div>

      {!decodificado ? (
        <p className="text-sm text-muted">
          {codigo
            ? "Código recebido — aguardando decodificação ou formato inválido."
            : "Aguardando envio do campo serialModelo pelo CETEVA."}
        </p>
      ) : (
        <>
          {!decodificado.comprimentoValido && (
            <p className="mb-3 text-sm text-atencao">
              Esperado 12 caracteres — recebido {decodificado.codigo.length}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
            {decodificado.segmentos.map((s) => (
              <div
                key={`${s.grupo}-${s.posicao}`}
                className={`rounded-lg border px-2.5 py-2 ${
                  s.conhecido ? "border-line bg-panel-2" : "border-atencao/40 bg-atencao-soft"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  {s.grupo}
                </p>
                <p className="mt-0.5 font-mono text-base font-bold text-fg">{s.codigo || "—"}</p>
                <p
                  className={`mt-0.5 text-[11px] leading-snug ${
                    s.conhecido ? "text-fg" : "text-atencao"
                  }`}
                >
                  {s.descricao}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">Pos. {s.posicao}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
