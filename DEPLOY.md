# Deploy: PC → Git → Servidor

## 1. No seu PC (enviar código pro Git)

Abra o terminal na pasta do projeto (`pix`) e rode:

```powershell
cd C:\Users\Jhennifer\Desktop\pix\pix
git add .
git status
git commit -m "PIX: credenciais via .env e deploy"
git push origin main
```

(Se a branch for `master`, use `git push origin master`.)

---

## 2. No servidor (baixar código e configurar)

SSH no servidor, vá na pasta do projeto e atualize:

```bash
cd /root/pix
git pull origin main
npm install
```

**Se o `git pull` der erro "Your local changes would be overwritten" (ex.: em `scripts/check-bb-token.js`):** descarte as alterações locais **e** force o repositório a ficar igual ao remoto, depois puxe e reinicie:

```bash
cd /root/pix
git checkout -- .
git clean -fd
git fetch origin main
git reset --hard origin/main
npm install
pm2 restart pix-system --update-env
```

- **`git reset --hard origin/main`** deixa a pasta exatamente igual ao que está no GitHub (qualquer alteração local é perdida).
- Se preferir não usar `reset --hard`, use só descarte do arquivo que aparece no erro: `git checkout -- scripts/check-bb-token.js` e depois `git pull origin main`.

Assim o servidor fica com o código mais recente (incluindo o uso de `BB_OAUTH_TOKEN` no startup).

---

## 2.1. Confirmar que está atualizado (não dá mais o mesmo erro)

**No servidor:** depois de `git pull` e `pm2 restart`, confira:

1. **Build do servidor:** abra no navegador `https://pix.masterclassic.com.br/api/version`. Deve retornar algo como `{"version":"2.0.0","build":"2025-01-29T12-30-00","bbOAuthTokenLoaded":true}`. O **build** muda a cada restart do PM2 — se for recente, o servidor está com o código novo.
2. **Na página do painel:** no canto inferior direito aparece **"Build 2025-01-29T..."**. Se esse horário for de depois do último deploy, a página está nova.
3. **Log do PM2:** `pm2 logs pix-system --out --lines 20`. Deve aparecer **`[startup] BB_OAUTH_TOKEN carregado do .env`** (se o token estiver no .env).

**Se `/api/version` retornar `{"error":"API endpoint not found"}`:** o servidor está com **código antigo**. No servidor rode: `cd /root/pix && git fetch origin main && git reset --hard origin/main && pm2 restart pix-system --update-env`. Depois abra de novo `https://pix.masterclassic.com.br/api/version` — deve retornar JSON com `version`, `build` e `bbOAuthTokenLoaded`.

**Se aparecer "502 Bad Gateway" (Nginx):** o Nginx está na frente do app e **não está recebendo resposta** do Node (PM2). No servidor confira: (1) `pm2 status` — o processo `pix-system` está **online**? (2) `pm2 logs pix-system --lines 30` — o app subiu sem erro? (3) Se o app caiu, rode `cd /root/pix && npm install && pm2 restart pix-system --update-env`. (4) Confirme que o Nginx faz proxy para o mesmo endereço/porta em que o app escuta (ex.: `proxy_pass http://127.0.0.1:3000`).

**Se aparecer "no such column: now" (SQLite) em `/api/auth/me`:** foi corrigido na base: a query de sessão usa `datetime('now')` com aspas simples. Atualize o código no servidor (`git pull` ou `git reset --hard origin/main`) e reinicie o PM2.

**Se aparecer "SyntaxError: Unexpected token '}'":** algum arquivo no servidor pode estar quebrado ou desatualizado. No servidor rode: `cd /root/pix && git fetch origin main && git reset --hard origin/main && node -c server.js`. Se `node -c server.js` falhar, a mensagem indica o arquivo com erro; se passar, reinicie com `pm2 restart pix-system --update-env`.

**Se aparecer "Falha ao obter token OAuth (HTTP 401): Identificador ou credenciais inválidos":** o app está chamando o OAuth do BB e as credenciais (no banco) estão erradas ou de outro ambiente. **Solução rápida:** defina **BB_OAUTH_TOKEN** no `.env` do servidor (token do n8n, nó "2. OAuth Token", ou `npm run test:oauth`) e reinicie — assim o app **não** chama o OAuth. **Alternativa:** atualize as credenciais no banco com as de **produção**: `BasicToken=... APIKey=... node scripts/set-pix-credentials.js` (use os mesmos valores do n8n Jornada 3 - Produção).

**Se continuar dando o mesmo erro:**

- **Navegador:** faça **atualização forçada** para não usar cache: **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac). Ou abra o site em aba anônima.
- **Servidor:** confirme que o `git pull` rodou sem erro e que o PM2 reiniciou: `cd /root/pix && git log -1 --oneline && pm2 restart pix-system --update-env`.

---

## 3. No servidor: credenciais BB (produção)

**Opção A – Arquivo .env**

Crie ou edite o `.env` na pasta do projeto e coloque (substitua pelos seus valores se precisar):

```
BasicToken=SEU_BASIC_AUTH_BASE64_AQUI
APIKey=SUA_GW_APP_KEY_AQUI
```

Depois rode:

```bash
node scripts/set-pix-credentials.js
```

**Opção B – Uma linha (Linux/macOS)**

```bash
export BasicToken="SEU_BASIC"; export APIKey="SUA_APP_KEY"; node scripts/set-pix-credentials.js
```

**Opção C – PowerShell (Windows no servidor)**

```powershell
$env:BasicToken="SEU_BASIC"; $env:APIKey="SUA_APP_KEY"; node scripts/set-pix-credentials.js
```

---

## 4. No servidor: reiniciar o app

Se usar PM2:

```bash
pm2 restart pix-system --update-env
pm2 logs pix-system --lines 30
```

Se rodar direto com Node:

```bash
npm start
```

---

## 5. (Obrigatório se aparecer 429) Token OAuth manual – BB_OAUTH_TOKEN

Se o log mostrar **429 Too Many Requests** ou "Erro ao obter token OAuth", o Cloudflare/BB está bloqueando o IP do servidor. Nesse caso é **obrigatório** usar token manual.

### Conferir se o servidor está lendo o .env

No servidor, na pasta do projeto (ex: `/root/pix`):

```bash
cd /root/pix
node scripts/check-bb-token.js
```

- Se aparecer **"BB_OAUTH_TOKEN não encontrado"** ou **"process.env.BB_OAUTH_TOKEN está undefined"**, você precisa adicionar a variável no `.env`.
- Se aparecer **"BB_OAUTH_TOKEN encontrado"** / **"está definido"** e o PM2 ainda der 429, reinicie com `pm2 restart pix-system --update-env` e confira de novo os logs.

### Adicionar BB_OAUTH_TOKEN no servidor

**Opção 1 – Editar o .env**

```bash
cd /root/pix
nano .env
```

Adicione uma linha (substitua pelo token real):

```
BB_OAUTH_TOKEN=COLE_O_ACCESS_TOKEN_AQUI
```

Salve (Ctrl+O, Enter, Ctrl+X).

**Opção 2 – Uma linha (substitua TOKEN_AQUI pelo access_token real)**

```bash
cd /root/pix
echo 'BB_OAUTH_TOKEN=TOKEN_AQUI' >> .env
```

**Como obter o token:**

- **n8n:** Rode o fluxo "Jornada 3 - Produção", abra o nó "2. OAuth Token" e copie o `access_token` da saída.
- **No seu PC:** `npm run test:oauth` e copie o token exibido.

Depois:

```bash
pm2 restart pix-system --update-env
pm2 logs pix-system --lines 25
```

No log deve aparecer **`BB_OAUTH_TOKEN definido`** ou **`BB_OAUTH_TOKEN carregado do .env`**. A partir daí o app não chama mais o OAuth e o 429 para.

### Se ainda aparecer 429 no log de erro

1. **Confirmar que o servidor está com o código novo**  
   O app só para de chamar o OAuth se o código que usa `BB_OAUTH_TOKEN` estiver no servidor. Rode no servidor:

   ```bash
   cd /root/pix
   grep -n "BB_OAUTH_TOKEN" services/pixService.js | head -5
   ```

   Se não aparecer nenhuma linha, o código está antigo. Ajuste o git e puxe de novo:

   ```bash
   git checkout -- .
   git pull origin main
   pm2 restart pix-system --update-env
   ```

2. **Olhar o log de saída (out), não só o de erro**  
   A mensagem de startup aparece no **out**:

   ```bash
   pm2 logs pix-system --out --lines 50
   ```

   Procure por **`[startup] BB_OAUTH_TOKEN carregado do .env`**.  
   Se aparecer **`[startup] BB_OAUTH_TOKEN não está no .env`**, o processo não está lendo o `.env` (confira o caminho que aparece no log e se o `.env` está nessa pasta).

3. **Reiniciar de novo após o pull**  
   Depois de um `git pull` bem-sucedido, sempre rode:

   ```bash
   pm2 restart pix-system --update-env
   pm2 logs pix-system --out --lines 30
   ```

---

**Resumo:** No PC: `git add .` → `commit` → `push`. No servidor: `git pull` (resolvendo conflitos com `git checkout -- .` se precisar) → `.env` com `BasicToken`, `APIKey` e `BB_OAUTH_TOKEN` → `node scripts/set-pix-credentials.js` → `pm2 restart pix-system --update-env`. Verificar no log **out** a mensagem `[startup] BB_OAUTH_TOKEN carregado`.
