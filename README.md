# DashDelta · CETEVA

Interface **operacional crítica de fábrica** para acompanhamento de testes do CETEVA.
Foco em **clareza, velocidade de leitura, identificação de falhas e rastreabilidade** — não é um relatório.

Duas visões no mesmo app, alternáveis na tela de **Configuração**:

- **Operador** (console da máquina): leitura em 2–3 segundos, cards essenciais e mensagem operacional.
- **Supervisão** (engenharia/qualidade): análise, exceções, gráficos e rastreabilidade completa.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS v4** (design system por CSS variables, tema claro/escuro)
- **Recharts** (gráficos)

## Como rodar

```bash
npm install
npm run dev      # http://0.0.0.0:3000 (acessível na rede WiFi)
npm run build    # build de produção
npm start        # produção (0.0.0.0:3000)
```

A dashboard **inicia vazia**, pronta para receber dados reais via HTTP.
Não há dados fictícios nem simulação automática.

A tela de **Configuração** (`/config`) permite:
- alternar **Modo** (Operador / Supervisão) e **Tema** (Escuro / Claro / Sistema);
- ajustar o **intervalo de atualização** (polling);
- ver a **URL de integração** e limpar o histórico recebido.

As preferências ficam salvas no `localStorage` do console.

## Integração — recebimento de dados

O app externo (CETEVA) envia cada teste via **HTTP POST** na rede WiFi (objeto único ou array):

```
POST http://<IP-do-console>:3000/api/testes
Content-Type: application/json
```

```json
{
  "serial": "",
  "dthInicio": "20/05/2026 15:41:15",
  "dthGeraLog": "2026-05-20 15:41:15",
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
}
```

Campos opcionais de rastreabilidade: `modelo`, `linha`, `ipCeteva`, `operador`.

| Método | Rota | Função |
| --- | --- | --- |
| `POST` | `/api/testes` | **Ingestão de teste(s)** — rota principal |
| `GET` | `/api/testes` | Status da API + últimos 50 testes |
| `DELETE` | `/api/testes` | Limpa o histórico em memória |
| `GET` | `/api/snapshot` | Estado agregado consumido pelas telas |

> Armazenamento atual: **store em memória** (`src/lib/store.ts`). Para persistência,
> basta trocar esse módulo por um adaptador de banco — a UI não muda.

## Padronização visual (estados)

| Estado | Cor | Uso |
| --- | --- | --- |
| Normal / Aprovado | **Verde** | `--ok` |
| Atenção / próximo do limite | **Amarelo** | `--atencao` |
| Falha crítica / ação imediata | **Vermelho** | `--falha` |
| Base do layout / informativo | **Azul** | `--accent` / fundo azul escuro |

Regra de ouro: **nunca pintar a tela inteira de vermelho** — destaca-se apenas o
componente afetado (borda lateral/superior + animação sutil de pulso em falha).

## Regras de cálculo (mapeamento dos cards)

Resultado do teste (campo `status`):

- `0` / `pass` / `aprovado` → **APROVADO** (verde)
- `1` / `fail` / `reprovado` → **REPROVADO** (vermelho)

Classificação de cada parâmetro (`OK` / `Atenção` / `Falha`):

- **Texto**: palavras-chave (`ok`, `normal` → OK; `atenção`, `limite` → Atenção;
  `fail`, `ng`, `sem com`, `alto`, `fora` → Falha).
- **Numérico** (Corrente, Potência): faixas opcionais por parâmetro
  (`src/lib/domain/parametros.ts`); sem faixa, valor `> 0` = OK e `0` = Atenção.
- **Vazio**: `Indefinido` (cinza).

Destaques automáticos (exceções prioritárias):

- Falha de comunicação **ODU**
- **Ruído** fora da faixa
- **Potência/Corrente** fora do padrão
- **Sequência de reprovações** (≥ 3 consecutivas)
- **Ausência de operador**

Agregações (visão de supervisão), sobre as últimas 24h:

- **Yield** = aprovados / (aprovados + reprovados)
- **Tempo médio** = média do campo `tempo_teste` (`HH:mm:ss`, ex.: `"00:00:31"`); se ausente, usa (`dthGeraLog` − `dthInicio`)
- **Tendência de desvio por hora** (últimas 12h)
- **Taxa de aprovação por parâmetro**

## Estrutura

```
src/
├─ app/
│  ├─ api/{testes,snapshot,seed}/route.ts   # ingestão, estado, dados de exemplo
│  ├─ config/page.tsx                       # tela de configuração
│  ├─ layout.tsx · page.tsx · globals.css
├─ components/
│  ├─ ui/         # Card, MetricCard, StatusDot/Badge, ParametroRow, SemaforoItem
│  ├─ charts/     # TendenciaChart, TaxaParametroChart
│  ├─ views/      # OperadorView, SupervisaoView
│  ├─ Dashboard.tsx · Topbar.tsx · EmptyState.tsx
├─ context/ConfigContext.tsx                # modo, tema, polling, simulação
├─ hooks/         # useSnapshot (polling), useSimulacao
└─ lib/
   ├─ domain/     # types, parametros (catálogo), rules (regras + agregações)
   ├─ store.ts    # store em memória (singleton)
   ├─ sampleData.ts · format.ts
```

## Componentização (reuso)

Cards e estados são componentes únicos reutilizados nas duas telas
(`MetricCard`, `Card`, `StatusDot`, `ParametroRow`, `SemaforoItem`), garantindo
consistência visual e manutenção centralizada das regras de cor/estado.
