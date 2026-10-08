# Azion Implementation Portal

Este repositório contém a estrutura pronta para deploy estático no **Azion Console** integrado via Git.

## Arquivos do Projeto

Só a pasta `public/` é publicada. As demais pastas ficam fora do deploy.

- `public/index.html`: Portal principal contendo os links para os importadores.
- `public/bind-import.html`: Formulário de importação de arquivo BIND DNS.
- `public/gemini-code-1785458000658.html`: Redirecionamento do nome antigo para `bind-import.html`.
- `public/cf-migration-index.html`: Formulário de automação Cloudflare -> Azion.
- `functions/migration-proxy.js`: Azion Function que repassa os formulários para o n8n (não publicada como arquivo estático).
- `n8n/cf-migration.workflow.json`: Workflow do n8n da automação Cloudflare -> Azion (não publicado).

## Configuração de Deploy na Azion

1. Crie um novo projeto no **Azion Console** selecionando **Deploy via Git**.
2. Conecte com o seu repositório do GitHub.
3. Utilize as seguintes configurações:
   - **Preset / Framework**: `Static` ou `HTML`
   - **Root Directory**: `./`
   - **Build Command**: *(deixar em branco)*
   - **Install Command**: *(deixar em branco)*
   - **Output Directory**: `./public`

## Chamadas ao n8n

Os formulários nunca chamam o n8n direto. Eles enviam para `/api/...` no próprio domínio do portal, e a Azion Function `functions/migration-proxy.js` adiciona a chave de autenticação e repassa para o webhook. O domínio do n8n e a chave nunca chegam ao navegador.

| Formulário | Endpoint no portal | Variável com o webhook |
| --- | --- | --- |
| `cf-migration-index.html` | `/api/cf-migration` | `N8N_CF_WEBHOOK_URL` |
| `bind-import.html` | `/api/bind-import` | `N8N_BIND_WEBHOOK_URL` |

As chamadas usam caminho relativo, então funcionam em qualquer domínio ligado ao projeto. O proxy recusa chamadas de navegador vindas de outro domínio.

### 1. n8n
1. Importe `n8n/cf-migration.workflow.json`.
2. Crie uma credencial **Header Auth** chamada `CF Migration - Webhook Key`:
   - **Name**: `X-Migration-Key`
   - **Value**: um segredo forte (ex.: `openssl rand -hex 32`)
3. Selecione essa credencial no nó **Webhook** e ative o workflow.
4. Recomendado: use a mesma credencial no webhook `bind-to-azion` (o proxy já envia o header).

### 2. Azion
1. Crie uma Function com o conteúdo de `functions/migration-proxy.js`.
2. Em **Environment Variables** no Azion Console, crie:
   - `N8N_CF_WEBHOOK_URL`: `https://<n8n>/webhook/8469c71d-08fb-4530-ac12-d09a4002a420`
   - `N8N_BIND_WEBHOOK_URL`: `https://<n8n>/webhook/bind-to-azion`
   - `N8N_WEBHOOK_KEY`: o mesmo valor da credencial do n8n
3. Instancie a Function na Application do portal e crie uma regra no Rules Engine:
   - **Critério**: `${uri}` começa com `/api/`
   - **Comportamento**: `Run Function` → proxy acima
