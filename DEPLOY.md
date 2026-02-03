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
cd /caminho/do/projeto/pix
git pull origin main
npm install
```

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

---

**Resumo:** No PC: `git add .` → `commit` → `push`. No servidor: `git pull` → `.env` com `BasicToken` e `APIKey` → `node scripts/set-pix-credentials.js` → se der 429, adicionar `BB_OAUTH_TOKEN` no `.env` → `pm2 restart pix-system --update-env`.
