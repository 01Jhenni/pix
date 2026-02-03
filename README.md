# PIX – Sistema de Recorrências (Banco do Brasil)

Sistema para gerenciamento de recorrências PIX do Banco do Brasil: painel admin, geração de QR Code e PIX Copia e Cola, API para integração externa.

---

## Acesso e execução

- **Produção:** https://pix.masterclassic.com.br  
- **API externa:** https://pix.masterclassic.com.br/api/v1/pix  

```bash
npm install
npm start
```

Acesso local: `http://localhost:3000`

**Login padrão (criado automaticamente no servidor):** usuário `admin`, senha `CeciM@042425`

---

## Certificados SSL (BB)

A API do BB exige certificados do cliente (mTLS). Coloque na pasta **`certificates/`**:

- `cert.pem` (certificado)
- `key.pem` ou `chave.pem` (chave privada)

Ou defina no servidor as variáveis: **`SSL_CERT`** e **`SSL_KEY`** (conteúdo completo dos arquivos). Use os mesmos certificados da credencial **"Vida Ouro"** do n8n para gerar QR Code.

No servidor, os arquivos em `certificates/` **não vão no git** (.gitignore). Envie-os manualmente (SCP, File Manager) ou use as variáveis de ambiente.

---

## API

### Painel (com login)

- `POST /api/pix/jornada3` – Criar recorrência (body: `pixUserId`, dados do devedor/recebedor)
- `GET /api/pix/qrcode/:txid` – Obter QR Code
- `GET /api/users`, `POST /api/users` – Usuários PIX
- `GET /health` – Health check

### Integração externa (API Key)

Envie o header **`X-API-Key: sua-api-key`** (gerada no painel em "API & Integração").

- `POST /api/v1/pix/jornada3` – Criar recorrência (body JSON com `cpfDevedor`, `nomeDevedor`, `contrato`, `dataInicial`, `periodicidade`, `politicaRetentativa`, `valorRec`, `valorPrimeiroPagamento`, `chavePixRecebedor`, `nomeRecebedor`, `cidadeRecebedor`; opcional `pixUserId`)
- `GET /api/v1/pix/qrcode/:txid` – Obter QR Code e PIX Copia e Cola
- `GET /api/v1/pix/transactions` – Listar transações
- `GET /api/v1/pix/recorrencia/:idRec` – Consultar recorrência

---

## Banco do Brasil – Credenciais e ambiente

### Produção

| Campo | Valor |
|-------|--------|
| **GW_APP_KEY** | `83cd02629de140cf9af2426701994397` |
| **OAUTH_URL** | `https://oauth.bb.com.br/oauth/token` |
| **BASE_URL** | `https://api-pix.bb.com.br/pix/v2` |
| **BASIC_AUTH_BASE64** | *(valor **basic** do portal BB – ver bloco em CREDENCIAIS abaixo)* |

### Homologação

| Campo | Valor |
|-------|--------|
| **GW_APP_KEY** | `cc7d70998c8d43148e6cafd269a34bfd` |
| **OAUTH_URL** | `https://oauth.hm.bb.com.br/oauth/token` |
| **BASE_URL** | `https://api.hm.bb.com.br/pix/v2` |
| **BASIC_AUTH_BASE64** | *(valor **basic** do portal BB – ver bloco em CREDENCIAIS abaixo)* |

Use o **basic** do portal (não use clientID/clientSecret separados). Certificados (cert.pem, key.pem) devem ser do **mesmo ambiente** (produção ou homologação).

---

## Configurar como no n8n (Jornada 3 - Produção)

O fluxo do app replica o do n8n: **1. Config Dados** → **2. OAuth Token** → **3. Gerar TXID** → **4. Criar Cobrança** → **5. Criar LOCREC** → **7. Criar Recorrência** → **Polling GET /rec** → QR Code. Credenciais e URLs são as mesmas do nó "1. Config Dados" do n8n.

**Produção (default):** `oauth.bb.com.br` + `api-pix.bb.com.br`  
**Credenciais:** BasicToken = BASIC_AUTH_BASE64, APIKey = GW_APP_KEY (mesmos do n8n).

No servidor, na pasta do projeto:

```bash
export BasicToken="<valor BASIC_AUTH_BASE64 do portal BB>"
export APIKey="<valor GW_APP_KEY do portal BB>"
node scripts/set-pix-credentials.js
```

Ou em uma linha (substitua os valores):

```bash
BasicToken="SEU_BASE64" APIKey="SUA_GW_APP_KEY" node scripts/set-pix-credentials.js
```

**Usando .env:** Coloque no `.env` as linhas `BasicToken=...` e `APIKey=...` (mesmos nomes do n8n). Depois execute `node scripts/set-pix-credentials.js` — o script carrega o `.env` da raiz do projeto.

**PowerShell (Windows):**

```powershell
$env:BasicToken="SEU_BASE64"; $env:APIKey="SUA_GW_APP_KEY"; node scripts/set-pix-credentials.js
```

Certifique-se de ter **cert.pem** e **key.pem** (certificado Vida Ouro) em `certificates/` no servidor, como no n8n.

---

## Atualizar credenciais no servidor (homologação)

Para usar **homologação** em vez de produção:

```bash
export BB_OAUTH_URL="https://oauth.hm.bb.com.br/oauth/token"
export BB_BASE_URL="https://api.hm.bb.com.br/pix/v2"
export BasicToken="valor_basic_homolog"
export APIKey="appKey_homolog"
node scripts/set-pix-credentials.js
```

Se o script não existir no servidor, atualize o banco manualmente (produção):

```bash
# Produção (oauth.bb.com.br + api-pix.bb.com.br)
export BasicToken="SEU_BASE64"
export APIKey="SUA_GW_APP_KEY"
node -e "
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'data', 'pix.db'));
const basic = process.env.BasicToken || process.env.BB_BASIC_AUTH_BASE64;
const appKey = process.env.APIKey || process.env.BB_GW_APP_KEY;
const oauth = 'https://oauth.bb.com.br/oauth/token';
const base = 'https://api-pix.bb.com.br/pix/v2';
if (!basic || !appKey) { console.error('Defina BasicToken e APIKey'); process.exit(1); }
db.prepare('UPDATE pix_users SET oauth_url=?, base_url=?, basic_auth_base64=?, gw_app_key=?, updated_at=? WHERE id=1').run(oauth, base, basic, appKey, new Date().toISOString());
console.log('Credenciais produção atualizadas.');
"
```

---

## Scopes OAuth (portal BB)

No portal do desenvolvedor BB, habilite para a aplicação (ambiente correto: hm = homologação, produção = produção):

- `rec.write`, `rec.read`
- `payloadlocationrec.write`, `payloadlocationrec.read`
- `cobr.write`, `cobr.read`
- `cob.write`, `cob.read`

A **oauth_url** no banco deve ser do **mesmo ambiente** em que os scopes foram marcados (ex.: homologação → `https://oauth.hm.bb.com.br/oauth/token`).

Verificar configuração: `npm run check-config`

---

## Erros comuns e soluções

### 400 "Software não cadastrado"

- Coloque **cert.pem** e **key.pem** em `certificates/` (ou SSL_CERT/SSL_KEY no servidor).
- Confirme no portal BB que a aplicação está cadastrada e ativa para o ambiente usado.

### 403 Acesso negado

- Credenciais ok, mas **scopes** não habilitados ou **ambiente errado**. Verifique no portal BB os scopes e use a **oauth_url** do mesmo ambiente (hm/sandbox/produção).

### 429 Too Many Requests / Cloudflare "Access denied"

- **Cloudflare** na frente do OAuth está limitando/bloqueando o IP do servidor.
- O app **tenta de novo sozinho** até 5 vezes (espera 15 s, 30 s, 1 min, 2 min). Uma única tentativa de gerar QR pode levar alguns minutos e passar.
- **Para não depender do OAuth quando der 429:** (1) Defina **`BB_OAUTH_TOKEN`** no servidor (`.env` ou PM2) com um token válido; ou (2) **Envie o token na requisição**: no painel, use o campo **"Token OAuth BB (opcional)"** na tela de Gerar QR Code — cole o token obtido com `npm run test:oauth` (em outro ambiente) ou do n8n. Assim o app não chama `oauth/token` e gera o QR Code. O token vale ~1 h; renove quando expirar.
- Evite muitas requisições seguidas ao OAuth; o **token é cacheado** (~1 h).
- Se persistir: contate o BB para liberar o IP do servidor.

### BB_OAUTH_TOKEN não é reconhecido (app continua chamando OAuth e dando 429)

- O app carrega o `.env` do **diretório onde está o `server.js`** (não do cwd do PM2). Garanta que o arquivo `.env` está **na mesma pasta** que o `server.js`.
- No `.env`, use **exatamente** o nome `BB_OAUTH_TOKEN` (com `BB_` no início). Uma única linha, sem aspas: `BB_OAUTH_TOKEN=seu_token_aqui`.
- Reinicie com **variáveis atualizadas**: `pm2 restart pix-system --update-env`. Se usar **ecosystem.config.cjs**, defina `env.BB_OAUTH_TOKEN` no config e inicie com `pm2 start ecosystem.config.cjs` (ou `pm2 delete pix-system; pm2 start ecosystem.config.cjs`).
- Ao subir, o servidor escreve no log: **"✅ BB_OAUTH_TOKEN definido"** ou **"⚠️ BB_OAUTH_TOKEN não definido"**. Confira com `pm2 logs pix-system --lines 20`.

### Erro de certificado SSL ao gerar QR Code

- Coloque **cert.pem** e **key.pem** (credencial "Vida Ouro" do n8n) em `certificates/` no servidor (ou SSL_CERT/SSL_KEY).
- Confirme **base_url** do usuário PIX (homologação: `https://api.hm.bb.com.br/pix/v2`; produção: `https://api-pix.bb.com.br/pix/v2`).
- Reinicie o servidor (ex.: `pm2 restart pix-system`).

---

## Deploy (Terminus / servidor)

1. Repositório Git no GitHub; no Terminus: deploy via Git, branch `main`.
2. Build: `npm install` (ou `npm ci`). Start: `npm start`.
3. Variáveis de ambiente (se precisar): `BB_OAUTH_URL`, `BB_BASE_URL`, `BB_GW_APP_KEY`, `BB_BASIC_AUTH_BASE64`; para certificados sem arquivos: `SSL_CERT`, `SSL_KEY`.
4. Enviar **cert.pem** e **key.pem** para a pasta `certificates/` no servidor (não vão no git).
5. Opcional: PM2 – `pm2 start server.js --name pix-system`.

---

## Scripts npm

| Comando | Descrição |
|--------|------------|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia com watch |
| `npm run test:oauth` | Testa obtenção de token OAuth (BB) |
| `npm run check-config` | Mostra configuração do usuário PIX (oauth_url, etc.) |
| `npm run set-credentials` | Atualiza credenciais no banco (produção: BasicToken + APIKey; homolog: BB_OAUTH_URL + BB_BASE_URL + BasicToken + APIKey) |
| `npm run seed:homologacao` | Zera dados e insere usuário PIX de homologação para testes |
| `npm run create:admin` | Cria usuário admin (login do painel) |

---

## Estrutura resumida

- **`server.js`** – Entrada da aplicação; cria admin padrão se não existir.
- **`routes/`** – Rotas API (pix, auth, users, transactions, api-keys, profiles).
- **`services/pixService.js`** – Lógica PIX BB (OAuth, cob, locrec, rec, certificados SSL).
- **`database/sqlite-db.js`** – Persistência SQLite (pix_users, transactions, auth_users, api_keys).
- **`scripts/`** – test-oauth, set-pix-credentials, check-pix-config, seed-homologacao, create-admin.
- **`certificates/`** – cert.pem e key.pem (não versionados; obrigatórios para BB).
- **`data/pix.db`** – Banco SQLite (não versionado).

Documentação técnica BB: https://developers.bb.com.br/docs/pix
