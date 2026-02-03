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

## 5. (Opcional) Token OAuth manual – evitar 429

Se aparecer 429 (Too Many Requests) no OAuth, use um token manual. No servidor, adicione no `.env`:

```
BB_OAUTH_TOKEN=token_que_voce_obteve_do_n8n_ou_test_oauth
```

Reinicie:

```bash
pm2 restart pix-system --update-env
```

---

**Resumo:** No PC: `git add .` → `commit` → `push`. No servidor: `git pull` → configurar `.env` (BasicToken + APIKey) → `node scripts/set-pix-credentials.js` → `pm2 restart pix-system --update-env`.
