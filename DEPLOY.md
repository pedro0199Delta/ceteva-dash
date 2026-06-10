# Deploy CETEVA Dash · Vercel

## Pré-requisitos

- Conta [Vercel](https://vercel.com) + GitHub
- Repositório: [pedro0199Delta/ceteva-dash](https://github.com/pedro0199Delta/ceteva-dash)
- Domínio: `ceteva-dash.deltasollutions.com.br`

---

## 1. Enviar código ao GitHub

```powershell
cd C:\PROJETOS\DashDelta\PROJETO
git add .
git commit -m "CETEVA Dash: dashboard operacional com faixas e persistência KV"
git remote add origin https://github.com/pedro0199Delta/ceteva-dash.git
git branch -M main
git push -u origin main
```

---

## 2. Criar projeto na Vercel

1. [vercel.com/new](https://vercel.com/new) → Import **ceteva-dash**
2. Framework: **Next.js** (auto)
3. **Deploy** (primeiro deploy pode funcionar só para a UI; histórico exige KV — passo 3)

---

## 3. Banco Redis (histórico + faixas) — obrigatório

Na Vercel, com o projeto aberto:

1. **Storage** → **Create Database** → **Upstash Redis** (ou Marketplace → Redis)
2. Nome sugerido: `ceteva-dash-kv`
3. **Connect to Project** → selecione `ceteva-dash`
4. Isso injeta automaticamente:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. **Redeploy** o projeto (Deployments → ⋯ → Redeploy)

Sem Redis, a aplicação sobe mas **não guarda histórico** entre requisições.

---

## 4. Domínio customizado

1. Vercel → Project → **Settings** → **Domains**
2. Add: `ceteva-dash.deltasollutions.com.br`
3. No painel DNS do domínio **deltasollutions.com.br**, crie:

| Tipo  | Nome        | Valor                    |
|-------|-------------|--------------------------|
| CNAME | ceteva-dash | `cname.vercel-dns.com`   |

(Vercel mostra o valor exato ao adicionar o domínio.)

4. Aguarde propagação (minutos a algumas horas)

---

## 5. URLs finais

| Uso | URL |
|-----|-----|
| Dashboard | `https://ceteva-dash.deltasollutions.com.br` |
| Config / Faixas | `https://ceteva-dash.deltasollutions.com.br/config` |
| **Enviar testes (CETEVA)** | `POST https://ceteva-dash.deltasollutions.com.br/api/testes` |

---

## 6. JSON do CETEVA (formato real)

```json
{
  "serial": "ARC042600023302",
  "dthInicio": "2026-06-10 16:30:09",
  "dthGeraLog": "2026-06-10 16:30:46",
  "status": "pass",
  "id_machine": "MD2",
  "tempo_teste": "00:00:31",
  "Ligar Dispositivo": "1",
  "Corrente (A)": "1",
  "Potencia (W)": "19",
  "Display": "1",
  "Abertura Aleta": "1",
  "Ruido": "1",
  "Fluxo": "3",
  "Comunicacao ODU": "1",
  "Botao ON/OFF": "1"
}
```

No app CETEVA, troque `http://localhost:3000/api/testes` pela URL de produção acima.

---

## 7. Faixas padrão (já configuradas)

| Parâmetro | Mín | Máx |
|-----------|-----|-----|
| Ligar dispositivo | 1 | 1 |
| Corrente (A) | 1 | 2 |
| Potência (W) | 18 | 25 |
| Display | 1 | 1 |
| Aleta | 1 | 1 |
| Ruído | 1 | 1 |
| Fluxo | 2 | 10 |
| ODU | 1 | 1 |
| On/Off | 1 | 1 |

Altere em **/config** → Faixas de aprovação → Salvar.

---

## Desenvolvimento local

```powershell
npm install
npm run dev
```

Local usa arquivo `data/faixas.json` + memória (sem Redis).
